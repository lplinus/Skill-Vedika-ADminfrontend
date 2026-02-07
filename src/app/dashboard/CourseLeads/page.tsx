"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  ReactNode,
} from "react";

import { api } from "@/utils/axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import {
  FaSearch,
  FaEye,
  FaTrash,
  FaTimes,
  FaFileDownload,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import * as XLSX from "xlsx";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/* ----------------------------
   Small helpers & types
---------------------------- */
type Lead = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  course?: string;
  courses?: string[];
  contactedOn?: string;
  status?: string;
  leadSource?: string;
  admin_notes?: string;
  message?: string;
  created_at?: string;
};

function Detail({
  label,
  value,
}: {
  readonly label: string;
  readonly value: ReactNode;
}) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100">
      <p className="text-slate-500 font-medium text-sm">{label}</p>
      <p className="text-slate-800 text-sm">{value}</p>
    </div>
  );
}

function MessageBox({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="mt-4">
      <label className="text-slate-600 font-medium text-sm">{label}</label>
      <div
        className="mt-2 p-4 bg-slate-50 rounded-xl border-l-4 border-slate-200 text-slate-800 leading-relaxed shadow-sm text-justify"
        style={{ whiteSpace: "pre-line" }}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------------------------
   Accessibility: polite live region for errors
--------------------------- */
function ErrorLive({ message }: { readonly message: string | null }) {
  if (!message) return null;
  return (
    <output
      aria-live="polite"
      className="fixed bottom-6 right-6 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg shadow"
    >
      {message}
    </output>
  );
}

/* ----------------------------
   Color map for statuses (recommended)
   New: sky-600, Contacted: amber-600, Closed: emerald-600
---------------------------- */
const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; ring?: string }
> = {
  New: { bg: "bg-sky-50", text: "text-sky-700" },
  Contacted: { bg: "bg-amber-50", text: "text-amber-700" },
  Closed: { bg: "bg-emerald-50", text: "text-emerald-700" },
};

/* ----------------------------
   Helper functions to reduce cognitive complexity
---------------------------- */
function normalizeCourseItem(
  c: any,
  courseMap: Record<string, string>
): string {
  if (typeof c === "number" || (typeof c === "string" && /^\d+$/.test(c))) {
    return courseMap[String(c)] ?? String(c);
  }
  if (typeof c === "string") return c;
  return c?.name || c?.title || String(c);
}

function extractCoursesArray(
  r: any,
  courseMap: Record<string, string>
): string[] {
  try {
    if (Array.isArray(r.courses) && r.courses.length) {
      return r.courses
        .map((c: any) => normalizeCourseItem(c, courseMap))
        .filter(Boolean);
    }
    if (Array.isArray(r.course) && r.course.length) {
      return r.course
        .map((c: any) => normalizeCourseItem(c, courseMap))
        .filter(Boolean);
    }
    if (
      typeof r.course === "number" ||
      (typeof r.course === "string" && /^\d+$/.test(r.course))
    ) {
      const key = String(r.course);
      return [courseMap[key] ?? key];
    }
    if (typeof r.course === "string") return [r.course];
    if (r.course && typeof r.course === "object") {
      return [r.course.name ?? r.course.title ?? r.course.course_name].filter(
        Boolean
      );
    }
    if (r.course_name) return [r.course_name];
    return [];
  } catch {
    return [];
  }
}

function extractLeadSource(r: any): string {
  const direct = r.lead_source ?? r.source ?? r.leadSource;
  if (direct) return direct;

  let meta: any = r.meta ?? r.meta_data ?? r.metaFields ?? null;
  if (meta === null && r.meta !== undefined) meta = r.meta;
  if (typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      // leave as string
    }
  }

  if (meta && typeof meta === "object") {
    return (
      meta.lead_source ??
      meta.leadSource ??
      meta.source ??
      meta.page ??
      meta.utm_source ??
      meta.referrer ??
      ""
    );
  }

  return "";
}

/* ----------------------------
   Component
---------------------------- */
export default function CourseLeads() {
  // data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allCourses, setAllCourses] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [courseMap, setCourseMap] = useState<Record<string, string>>({});


  useEffect(() => {
    if (!Object.keys(courseMap).length || leads.length === 0) return;
  
    setLeads((prev) =>
      prev.map((lead) => {
        const coursesArr = extractCoursesArray(lead, courseMap);
  
        return {
          ...lead,
          courses: coursesArr,
          course: coursesArr.length
            ? coursesArr.join(", ")
            : lead.course,
        };
      })
    );
  }, [courseMap]);
  

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [confirmTitle, setConfirmTitle] = useState<string>("Confirm Deletion");

  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [pageSize, setPageSize] = useState<number>(20);

  // Sorting
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const router = useRouter();

  // CRITICAL: Track previous filter values to detect changes and prevent infinite loops
  const prevFiltersRef = useRef({
    debouncedSearch: "",
    statusFilter: "",
    courseFilter: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "id",
    sortDir: "desc" as "asc" | "desc",
    pageSize: 20,
  });

  // CRITICAL: Flag to prevent page sync from triggering re-fetch
  const isSyncingPageRef = useRef(false);

  // CRITICAL: Track last fetch params to prevent duplicate fetches
  const lastFetchParamsRef = useRef<string>("");

  /* -----------------------------------
     Helper: Extract data array from response
  ----------------------------------- */
  function extractDataArray(body: any): any[] {
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.data)) return body.data;
    if (Array.isArray(body.items)) return body.items;
    return [];
  }

  /* -----------------------------------
     Helper: Normalize single lead record
  ----------------------------------- */
  // function normalizeLead(r: any, courseMap: Record<string, string>): Lead {
  //   const contactedCandidate =
  //     r.contacted_on ?? r.contactedOn ?? r.created_at ?? r.createdAt;
  //   const coursesArr = extractCoursesArray(r, courseMap);

  //   let joinedCourse: string;
  //   if (coursesArr.length) {
  //     joinedCourse = coursesArr.join(", ");
  //   } else if (
  //     typeof r.course === "number" ||
  //     (typeof r.course === "string" && /^\d+$/.test(r.course))
  //   ) {
  //     joinedCourse = courseMap[String(r.course)] ?? String(r.course);
  //   } else {
  //     joinedCourse = r.course_name ?? r.course ?? r.title ?? "";
  //   }

  //   // Preserve status from database, only default to "New" if truly missing
  //   const statusValue = r.status;
  //   const normalizedStatus =
  //     statusValue &&
  //     typeof statusValue === "string" &&
  //     statusValue.trim() !== ""
  //       ? statusValue
  //       : "New";

  //   return {
  //     id: r.id,
  //     name: r.name,
  //     email: r.email ?? "",
  //     phone: r.phone ?? "",
  //     courses: coursesArr,
  //     course: joinedCourse,
  //     admin_notes: r.admin_notes ?? r.adminNotes ?? "",
  //     contactedOn: contactedCandidate || null,
  //     status: normalizedStatus,
  //     leadSource: extractLeadSource(r),
  //     message: r.message ?? "",
  //     created_at: r.created_at ?? r.createdAt,
  //   };
  // }

  function normalizeLead(r: any, courseMap: Record<string, string>): Lead {
    const contactedCandidate =
      r.contacted_on ?? r.contactedOn ?? r.created_at ?? r.createdAt;
  
    const coursesArr = extractCoursesArray(r, courseMap);
  
    let joinedCourse: string;
    if (coursesArr.length) {
      joinedCourse = coursesArr.join(", ");
    } else if (
      typeof r.course === "number" ||
      (typeof r.course === "string" && /^\d+$/.test(r.course))
    ) {
      joinedCourse = courseMap[String(r.course)] ?? String(r.course);
    } else {
      joinedCourse = r.course_name ?? r.course ?? r.title ?? "";
    }
  
    return {
      id: r.id,
      name: r.name,
      email: r.email ?? "",
      phone: r.phone ?? "",
      courses: coursesArr,
      course: joinedCourse, // 👈 KEEP THIS
      admin_notes: r.admin_notes ?? r.adminNotes ?? "",
      contactedOn: contactedCandidate || null,
      status:
        typeof r.status === "string" && r.status.trim()
          ? r.status
          : "New",
      leadSource: extractLeadSource(r),
      message: r.message ?? "",
      created_at: r.created_at ?? r.createdAt,
    };
  }
  

  /* -----------------------------------
     Helper: Handle fetch error
  ----------------------------------- */
  function handleFetchError(err: any) {
    const status = err?.response?.status;
    const errorMessage =
      err?.response?.data?.message || err?.message || "Unknown error";
    const errorDetails =
      err?.response?.data?.error || err?.response?.data?.errors || null;

    let userMessage: string;
    if (status === 500) {
      userMessage =
        "Server error. Please check the backend logs or try again later.";
    } else if (status === 401) {
      userMessage = "Unauthorized. Please login again.";
    } else if (status === 404) {
      userMessage = "Leads endpoint not found.";
    } else if (status) {
      userMessage = `Failed to load leads (${status}): ${errorMessage}`;
    } else {
      userMessage = `Failed to load leads: ${errorMessage}`;
    }

    console.error("[CourseLeads] Error details:", {
      status,
      message: errorMessage,
      details: errorDetails,
      fullError: err,
    });

    setError(userMessage);
    toast.error(userMessage);
  }

  /* -----------------------------------
     fetchLeads - robust normalizing
     - uses params consistent with backend expectations
     - sets courses & course fields for frontend flexibility
  ----------------------------------- */
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // CRITICAL: Use the current state values directly to avoid stale closures
      // These values are captured at the time of the callback creation
      // If currentPage changes, fetchLeads will be recreated with new values
      const params: Record<string, any> = {
        page: currentPage, // This will be the latest currentPage when fetchLeads is called
        limit: pageSize,
      };

      console.log(
        "[CourseLeads] 🚀 fetchLeads called with currentPage:",
        currentPage,
        "pageSize:",
        pageSize
      );
      // Only add non-empty filter values
      const trimmedSearch = debouncedSearch?.trim();
      if (trimmedSearch) {
        params.search = trimmedSearch;
      }
      const trimmedSortBy = sortBy?.trim();
      if (trimmedSortBy) {
        params.sort_by = trimmedSortBy;
      }
      if (sortDir === "asc" || sortDir === "desc") {
        params.sort_dir = sortDir;
      }
      const trimmedStatus = statusFilter?.trim();
      if (trimmedStatus) {
        params.status = trimmedStatus;
      }
      const trimmedCourse = courseFilter?.trim();
      if (trimmedCourse) {
        params.course = trimmedCourse;
      }
      const trimmedDateFrom = dateFrom?.trim();
      if (trimmedDateFrom) {
        params.date_from = trimmedDateFrom;
      }
      const trimmedDateTo = dateTo?.trim();
      if (trimmedDateTo) {
        params.date_to = trimmedDateTo;
      }

      console.log(
        "[CourseLeads] 🔍 Fetching leads with params:",
        JSON.stringify(params, null, 2)
      );
      console.log("[CourseLeads] Active filter states:", {
        search: debouncedSearch || "(none)",
        status: statusFilter || "(none)",
        course: courseFilter || "(none)",
        dateFrom: dateFrom || "(none)",
        dateTo: dateTo || "(none)",
        sortBy,
        sortDir,
        page: currentPage,
        limit: pageSize,
      });

      console.log("--------------------------------");
      console.log("params", params);
      console.log("--------------------------------");
      // Use Next.js proxy route /api/leads (api baseURL is already "/api")
      const res = await api.get("/leads", {
        params,
      });

      console.log("[CourseLeads] ✅ Response received:", {
        status: res.status,
        itemsCount: Array.isArray(res.data?.data) ? res.data.data.length : 0,
        total: res.data?.total || 0,
        currentPage: res.data?.current_page || 0,
        lastPage: res.data?.last_page || 0,
      });
      console.log("--------------------------------");
      console.debug("[CourseLeads] Full response:", res.data);

      const body = res.data ?? {};
      const data = extractDataArray(body);
      const normalized: Lead[] = data.map((r: any) =>
        normalizeLead(r, courseMap)
      );
      console.log("normalized", normalized);

      setLeads(normalized);
      console.debug("[CourseLeads] fetched leads count:", normalized.length);
      console.debug(
        "[CourseLeads] fetched leads sample:",
        normalized.slice(0, 3)
      );

      // CRITICAL: Trust backend pagination metadata completely
      // Backend is the single source of truth for pagination
      const backendPage =
        body.current_page ?? body.page ?? body.currentPage ?? 1;
      const backendTotal = body.total ?? 0;
      const backendTotalPages =
        body.last_page ?? body.lastPage ?? body.total_pages ?? 1;
      const backendPerPage = body.per_page ?? body.perPage ?? pageSize;

      // Always use backend's totalPages - never recalculate
      setTotalPages(Math.max(1, backendTotalPages));
      setTotalLeads(backendTotal);
      console.log("--------------------------------");
      console.log("backendTotal", backendTotal);
      console.log("backendTotalPages", backendTotalPages);
      console.log("backendPerPage", backendPerPage);
      console.log("backendPage", backendPage);
      console.log("--------------------------------");

      // CRITICAL: Verify the data matches the requested page
      if (normalized.length > 0) {
        const firstLeadId = normalized[0]?.id;
        const lastLeadId = normalized.at(-1)?.id;
        console.log("[CourseLeads] 📊 Data verification:", {
          requestedPage: currentPage,
          backendPage,
          itemsReceived: normalized.length,
          firstLeadId,
          lastLeadId,
          expectedRange: `Leads ${(currentPage - 1) * pageSize + 1} to ${
            currentPage * pageSize
          }`,
        });
      }

      // CRITICAL: Only sync page if backend explicitly corrected an out-of-bounds request
      // Don't sync for minor differences - trust the frontend state for normal pagination
      const requestedPage = currentPage;
      const isOutOfBounds =
        requestedPage > backendTotalPages || requestedPage < 1;

      if (
        isOutOfBounds &&
        backendPage >= 1 &&
        backendPage <= backendTotalPages
      ) {
        // Backend corrected an out-of-bounds request - sync to the corrected page
        console.log(
          "[CourseLeads] ⚠️ Out-of-bounds page corrected: requested=",
          requestedPage,
          "backend=",
          backendPage,
          "totalPages=",
          backendTotalPages,
          "- syncing to backend"
        );
        isSyncingPageRef.current = true; // Prevent this sync from triggering re-fetch
        setCurrentPage(backendPage);
      }
      // For all other cases (including minor differences), trust the frontend state - don't sync
      // This prevents the page from jumping back when clicking pagination buttons

      console.log("[CourseLeads] ✅ Pagination synced:", {
        requestedPage: currentPage,
        backendPage,
        totalPages: backendTotalPages,
        total: backendTotal,
        perPage: backendPerPage,
        itemsOnPage: normalized.length,
        isOutOfBounds,
      });

      // CRITICAL: Update last fetch params after successful fetch to prevent duplicate requests
      // Always use the REQUESTED page (currentPage) for the fetchKey, not backendPage
      // This ensures that when we click page 2, the fetchKey matches what we requested
      // Only if backend corrected an out-of-bounds request do we use backendPage
      const pageForFetchKey = isOutOfBounds ? backendPage : currentPage;
      const fetchKey = JSON.stringify({
        page: pageForFetchKey,
        limit: backendPerPage,
        search: debouncedSearch || "",
        status: statusFilter || "",
        course: courseFilter || "",
        dateFrom: dateFrom || "",
        dateTo: dateTo || "",
        sortBy: sortBy || "id",
        sortDir: sortDir || "desc",
      });
      lastFetchParamsRef.current = fetchKey;

      console.log("[CourseLeads] 📝 Updated lastFetchParamsRef:", {
        requestedPage: currentPage,
        backendPage,
        isOutOfBounds,
        pageForFetchKey,
        fetchKey: fetchKey.substring(0, 100) + "...",
        previousKey: lastFetchParamsRef.current
          ? lastFetchParamsRef.current.substring(0, 100) + "..."
          : "(empty)",
      });
      console.log("--------------------------------");
      console.log("fetchKey", fetchKey);
      console.log("--------------------------------");
      console.log("pageForFetchKey", pageForFetchKey);
      console.log("--------------------------------");
      console.log("backendPage", backendPage);
      console.log("--------------------------------");
      console.log("currentPage", currentPage);
      console.log("--------------------------------");
      console.log("isOutOfBounds", isOutOfBounds);
      console.log("--------------------------------");
    } catch (err: any) {
      console.error("Failed to load leads", err);
      handleFetchError(err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    sortBy,
    sortDir,
    statusFilter,
    courseFilter,
    dateFrom,
    dateTo,
    courseMap,
  ]);

  // initial fetch & when page changes

  useEffect(() => {
    let mounted = true;
    const loadCourses = async () => {
      try {
        const res = await api.get("/courses", {
          // headers: { Accept: "application/json" },
        });
        const list = Array.isArray(res.data.data)
          ? res.data.data
          : res.data || [];
        const map: Record<string, string> = {};
        const normalizedCourses: Array<{ id: string; title: string }> = [];
        list.forEach((c: any) => {
          const id = String(c.id ?? c.course_id ?? c.courseId ?? "");
          const title = c.title ?? c.course_name ?? c.name ?? String(id);
          if (id) {
            map[id] = title || id;
            normalizedCourses.push({ id, title });
          }
        });
        if (mounted) {
          setCourseMap(map);
          // populate the courses dropdown with id/title pairs
          setAllCourses(normalizedCourses);
        }
      } catch (e: unknown) {
        // ignore - mapping will fallback to ids or server-provided names
        console.debug("Could not load course metadata for mapping", e);
      }
    };

    void loadCourses();
    return () => {
      mounted = false;
    };
  }, []);

  // debounce searchTerm -> debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 450);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // CRITICAL: Single unified effect that handles filters, pagination, and fetching
  // This prevents infinite loops by detecting actual changes and resetting page BEFORE fetch
  useEffect(() => {
    // Skip if we're syncing page (prevents loops from backend sync)
    if (isSyncingPageRef.current) {
      isSyncingPageRef.current = false;
      return;
    }

    const prev = prevFiltersRef.current;
    const current = {
      debouncedSearch,
      statusFilter,
      courseFilter,
      dateFrom,
      dateTo,
      sortBy,
      sortDir,
      pageSize,
    };

    // Detect if filters/search/sort/pageSize changed (not just currentPage)
    const filtersChanged =
      prev.debouncedSearch !== current.debouncedSearch ||
      prev.statusFilter !== current.statusFilter ||
      prev.courseFilter !== current.courseFilter ||
      prev.dateFrom !== current.dateFrom ||
      prev.dateTo !== current.dateTo ||
      prev.sortBy !== current.sortBy ||
      prev.sortDir !== current.sortDir ||
      prev.pageSize !== current.pageSize;

    // If filters changed, reset to page 1 BEFORE fetching
    if (filtersChanged) {
      console.log("[CourseLeads] 🔄 Filters changed - resetting to page 1");
      // Update ref FIRST to prevent detecting this as a change on next render
      prevFiltersRef.current = current;
      if (currentPage !== 1) {
        setCurrentPage(1);
        // Clear fetch cache to ensure fresh fetch
        lastFetchParamsRef.current = "";
        // Don't fetch yet - let the currentPage change trigger another effect run
        return;
      }
      // If already on page 1, clear cache and continue to fetch below
      lastFetchParamsRef.current = "";
    } else {
      // No filter change - just update ref for next comparison
      prevFiltersRef.current = current;
    }

    // CRITICAL: Create a unique key for this fetch to prevent duplicate requests
    const fetchKey = JSON.stringify({
      page: currentPage,
      limit: current.pageSize,
      search: current.debouncedSearch,
      status: current.statusFilter,
      course: current.courseFilter,
      dateFrom: current.dateFrom,
      dateTo: current.dateTo,
      sortBy: current.sortBy,
      sortDir: current.sortDir,
    });

    // Skip if we just fetched with these exact same params
    // BUT: Always allow fetch if page number changed (pagination)
    const lastFetch = lastFetchParamsRef.current
      ? JSON.parse(lastFetchParamsRef.current)
      : null;
    const pageChanged = lastFetch && lastFetch.page !== currentPage;

    if (!pageChanged && lastFetchParamsRef.current === fetchKey) {
      console.log(
        "[CourseLeads] ⏭️ Skipping duplicate fetch with same params",
        {
          currentKey: fetchKey.substring(0, 100) + "...",
          lastKey: lastFetchParamsRef.current.substring(0, 100) + "...",
          currentPage,
        }
      );
      return;
    }

    if (pageChanged) {
      console.log("[CourseLeads] 📄 Page changed - forcing new fetch", {
        oldPage: lastFetch?.page,
        newPage: currentPage,
      });
    }

    console.log("[CourseLeads] 🔑 Fetch key comparison:", {
      currentKey: fetchKey.substring(0, 100) + "...",
      lastKey: lastFetchParamsRef.current
        ? lastFetchParamsRef.current.substring(0, 100) + "..."
        : "(empty)",
      currentPage,
      pageChanged,
      willFetch: true,
    });

    // Fetch with current state (filters are stable, page is correct)
    console.log("[CourseLeads] 🔄 Fetching leads", {
      currentPage,
      pageSize: current.pageSize,
      debouncedSearch: current.debouncedSearch,
      statusFilter: current.statusFilter,
      courseFilter: current.courseFilter,
      dateFrom: current.dateFrom,
      dateTo: current.dateTo,
      sortBy: current.sortBy,
      sortDir: current.sortDir,
    });

    // Call fetchLeads - it will use the latest currentPage from its dependencies
    void fetchLeads();
    // NOTE: fetchLeads is NOT in dependencies to prevent infinite loops
    // fetchLeads is stable (useCallback) and uses current state values directly
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    statusFilter,
    courseFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
    // fetchLeads removed from deps - it's stable and uses current state
  ]);

  // Fetch fresh lead data when modal opens
  const fetchLeadDetails = useCallback(
    async (leadId: number) => {
      try {
        console.log("fetchLeadDetails", leadId);
        const res = await api.get(`/leads/${leadId}`, {
          // headers: { Accept: "application/json" },
        });

        const leadData = res.data?.data ?? res.data;
        if (leadData) {
          const normalized = normalizeLead(leadData, courseMap);
          setSelectedLead(normalized);
          setAdminNotes(normalized.admin_notes ?? "");
        }
      } catch (err: any) {
        console.error("Failed to fetch lead details:", err);
        toast.error("Failed to load lead details");
      }
    },
    [courseMap]
  );

  // sync adminNotes when selectedLead changes
  useEffect(() => {
    if (selectedLead) setAdminNotes(selectedLead.admin_notes ?? "");
    else setAdminNotes("");
  }, [selectedLead]);

  /* ---------------------------
     CRUD & helpers (use stable callbacks)
  --------------------------- */
  const ensureCsrf = useCallback(async () => {
    try {
      await api.get("/sanctum/csrf-cookie");
    } catch {
      // ignore - some setups won't need this
    }
  }, []);

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;

    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`));
    console.log("document.cookie", document.cookie);

    return match ? decodeURIComponent(match.split("=")[1]) : null;
  };

  // const authCfg = useCallback(() => {
  //   const keys = ["token", "admin_token", "auth_token"];
  //   if (globalThis.window === undefined) return { withCredentials: true };
  //   let token: string | null = null;
  //   for (const k of keys) {
  //     const t = localStorage.getItem(k);
  //     console.log('token', t);
  //     if (t) {
  //       token = t;
  //       break;
  //     }
  //   }

  //   return token
  //     ? { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
  //     : { withCredentials: true };
  // }, []);

  const authCfg = useCallback(() => {
    if (typeof window === "undefined") {
      return { withCredentials: true };
    }

    const token = getCookie("XSRF-TOKEN");
    console.log("token", token);

    return token
      ? {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : { withCredentials: true };
  }, []);

  const updateStatus = useCallback(
    async (status: string) => {
      if (!selectedLead) {
        toast.error("No lead selected");
        return;
      }

      try {
        await ensureCsrf();
        const cfg = authCfg();
        console.log(
          "[updateStatus] Making PUT request to:",
          `/leads/${selectedLead.id}/status`,
          "with config:",
          {
            hasToken: !!cfg.headers?.Authorization,
            withCredentials: cfg.withCredentials,
          }
        );

        const resp = await api.put(
          `/leads/${selectedLead.id}/status`,
          { status },
          cfg
        );
        console.log(
          "[updateStatus] Response received:",
          resp.status,
          resp.data
        );

        // Use the response data if available, otherwise use the status we sent
        const updatedStatus = resp?.data?.data?.status ?? status;

        // Optimistic update - no refetch needed
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id ? { ...l, status: updatedStatus } : l
          )
        );

        setSelectedLead((s) => (s ? { ...s, status: updatedStatus } : s));
        toast.success("Status updated");

        // DO NOT refetch - optimistic update is sufficient
        // Refetching causes the UI to reset and can overwrite the update
      } catch (err: any) {
        console.error("updateStatus error", err);
        console.error("Error details:", {
          message: err?.message,
          status: err?.response?.status,
          data: err?.response?.data,
          url: err?.config?.url,
          method: err?.config?.method,
        });

        const statusCode = err?.response?.status;
        const serverMsg =
          err?.response?.data?.message ||
          JSON.stringify(err?.response?.data || err.message);

        // DO NOT redirect on 404 - it's a route/endpoint issue, not auth
        if (statusCode === 401) {
          toast.error("Unauthenticated. Redirecting to login...");
          // HTTP-only cookie is already invalid/cleared by Laravel
          router.push("/");
        } else if (statusCode === 404) {
          // 404 means route not found - don't redirect, just show error
          toast.error(
            `Status update endpoint not found (404). Please check the API route.`
          );
          console.error(
            "404 on status update - route may not be configured correctly:",
            err?.config?.url
          );
        } else if (statusCode === 422) {
          toast.error("Validation failed when updating status");
        } else {
          toast.error(
            "Failed to update status: " + (err?.message || serverMsg)
          );
        }
      }
    },
    [selectedLead, ensureCsrf, authCfg, router]
    // fetchLeads removed - we use optimistic updates, no refetch needed
  );

  const saveAdminNotes = useCallback(async () => {
    if (!selectedLead) return;
    if (savingNotes) return; // Prevent multiple simultaneous saves

    setSavingNotes(true);
    try {
      // Try to ensure CSRF cookie, but don't fail if it doesn't work
      // The api interceptor will also try to get it automatically
      try {
        await ensureCsrf();
      } catch (error_) {
        console.debug("CSRF cookie fetch failed, continuing anyway:", error_);
      }

      // Send admin_notes to the protected updateStatus endpoint which accepts admin_notes as well.
      const payload: Record<string, unknown> = { admin_notes: adminNotes };
      const cfg = authCfg();
      console.log(
        "[saveAdminNotes] Making PUT request to:",
        `/leads/${selectedLead.id}/status`,
        "with config:",
        {
          hasToken: !!cfg.headers?.Authorization,
          withCredentials: cfg.withCredentials,
        }
      );

      const resp = await api.put(
        `/leads/${selectedLead.id}/status`,
        payload,
        cfg
      );
      console.log(
        "[saveAdminNotes] Response received:",
        resp.status,
        resp.data
      );

      // Update local state from response if server returned the updated lead, otherwise apply optimistic update
      const updated = resp?.data?.data;
      if (updated && typeof updated === "object") {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id
              ? { ...l, admin_notes: updated.admin_notes ?? adminNotes }
              : l
          )
        );
        setSelectedLead((s) =>
          s ? { ...s, admin_notes: updated.admin_notes ?? adminNotes } : s
        );
      } else {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id ? { ...l, admin_notes: adminNotes } : l
          )
        );
        setSelectedLead((s) => (s ? { ...s, admin_notes: adminNotes } : s));
      }

      toast.success("Notes saved successfully");
    } catch (err: any) {
      console.error("saveAdminNotes error", err);
      console.error("Error details:", {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
      });

      const status = err?.response?.status;
      // Surface helpful messages for common cases
      if (status === 401) {
        toast.error("Unauthenticated. Please login.");
      } else if (status === 404) {
        // 404 likely indicates the protected route isn't reachable (missing auth/session) or wrong baseURL
        const detail =
          err?.response?.data?.message ||
          JSON.stringify(err?.response?.data || err.message);
        toast.error(`Save failed (404): ${detail}`);
      } else if (status === 419) {
        toast.error(
          "CSRF token mismatch. Please refresh the page and try again."
        );
      } else if (status === 422) {
        toast.error("Validation failed while saving notes.");
      } else {
        const errorMsg =
          err?.response?.data?.message || err?.message || "Unknown error";
        toast.error(`Failed to save notes: ${errorMsg}`);
      }
    } finally {
      setSavingNotes(false);
    }

    // refresh list after save to ensure server state is reflected in table
  }, [selectedLead, adminNotes, ensureCsrf, savingNotes]);

  // Auto-save admin notes: debounce user typing and save when changed from server value
  useEffect(() => {
    if (!selectedLead) return;
    const original = selectedLead.admin_notes ?? "";
    // if nothing changed, don't schedule save
    if (adminNotes === original) return;

    const timer = setTimeout(() => {
      // fire-and-forget; saveAdminNotes already surfaces toasts for errors
      void saveAdminNotes();
    }, 1200);

    return () => clearTimeout(timer);
  }, [adminNotes, selectedLead, saveAdminNotes]);

  const deleteLead = useCallback(
    async (id: number) => {
      // Find the lead to get its name for confirmation
      const lead = leads.find((l) => l.id === id);
      const leadName = lead?.name || `Lead #${id}`;

      // Show custom confirmation modal
      setConfirmTitle("Delete Lead");
      setConfirmMessage(
        `Are you sure you want to delete "${leadName}"? This action cannot be undone.`
      );
      setConfirmAction(() => async () => {
        setIsConfirmOpen(false);
        try {
          const cfg = authCfg();
          console.log("cfg", cfg);
          console.log(
            "[deleteLead] Making DELETE request to:",
            `/leads/${id}`,
            "with config:",
            {
              hasToken: !!cfg.headers?.Authorization,
              withCredentials: cfg.withCredentials,
            }
          );
          await api.delete(`/leads/${id}`, cfg);
          console.log("[deleteLead] Delete successful");
          setLeads((prev) => prev.filter((x) => x.id !== id));
          setSelectedIds((prev) => prev.filter((x) => x !== id));
          toast.success("Lead deleted successfully");
        } catch (err: any) {
          console.error("deleteLead error", err);
          if (err?.response?.status === 401) {
            toast.error("Unauthenticated. Please login.");
          } else {
            setError("Failed to delete lead");
            toast.error("Failed to delete lead");
          }
        }
      });
      setIsConfirmOpen(true);
    },
    [authCfg, leads]
  );

  const deleteSelected = useCallback(async () => {
    if (!selectedIds.length) return;

    // Show custom confirmation modal
    const count = selectedIds.length;
    setConfirmTitle("Delete Selected Leads");
    setConfirmMessage(
      `Are you sure you want to delete ${count} ${
        count === 1 ? "lead" : "leads"
      }? This action cannot be undone.`
    );
    setConfirmAction(() => async () => {
      setIsConfirmOpen(false);
      try {
        const cfg = authCfg();
        await api.post("/leads/delete-multiple", { ids: selectedIds }, cfg);
        setLeads((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
        setSelectedIds([]);
        toast.success(`Deleted ${count} ${count === 1 ? "lead" : "leads"}`);
      } catch (err: any) {
        console.error("deleteSelected error", err);
        if (err?.response?.status === 401) {
          toast.error("Unauthenticated. Please login.");
        } else {
          setError("Failed to delete selected leads");
          toast.error("Failed to delete selected leads");
        }
      }
    });
    setIsConfirmOpen(true);
  }, [selectedIds, authCfg]);

  /* ---------------------------
     Exports (PDF / Excel)
  --------------------------- */
  const downloadLeadPDF = useCallback((lead: Lead) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Lead Details", 14, 20);

    doc.setFontSize(11);
    doc.text(`ID: ${lead.id}`, 14, 36);
    doc.text(`Name: ${lead.name}`, 14, 44);
    doc.text(`Email: ${lead.email}`, 14, 52);
    doc.text(`Phone: ${lead.phone}`, 14, 60);
    doc.text(`Course: ${lead.course}`, 14, 68);
    doc.text(`Status: ${lead.status}`, 14, 76);
    doc.text(`Contacted On: ${lead.contactedOn}`, 14, 84);

    const messageLines = doc.splitTextToSize(lead.message ?? "", 180);
    doc.text("Message:", 14, 96);
    doc.text(messageLines, 14, 104);

    doc.save(`Lead-${String(lead.name).replaceAll(/\s+/g, "_")}.pdf`);
  }, []);

  const downloadExcel = useCallback(async () => {
    try {
      // Show loading state
      const loadingToast = toast.loading("Preparing export...");

      // Build export params (same as current filters, but no pagination)
      const exportParams: Record<string, any> = {};
      if (debouncedSearch) exportParams.search = debouncedSearch;
      if (sortBy) exportParams.sort_by = sortBy;
      if (sortDir) exportParams.sort_dir = sortDir;
      if (statusFilter) exportParams.status = statusFilter;
      if (courseFilter) exportParams.course = courseFilter;
      if (dateFrom) exportParams.date_from = dateFrom;
      if (dateTo) exportParams.date_to = dateTo;

      // Fetch all filtered leads (no pagination)
      const res = await api.get("/leads/export", {
        params: exportParams,
        headers: { Accept: "application/json" },
      });

      toast.dismiss(loadingToast);

      // Backend export returns: { success: true, data: [...], count: N }
      const responseData = res.data;
      if (!responseData?.success) {
        toast.error(
          "Failed to export leads: " +
            (responseData?.message ?? "Unknown error")
        );
        return;
      }

      // Extract data array - backend returns { success: true, data: [...] }
      let allLeads: unknown[] = [];
      if (Array.isArray(responseData.data)) {
        allLeads = responseData.data;
      } else if (Array.isArray(responseData)) {
        allLeads = responseData;
      }

      if (allLeads.length === 0) {
        toast.error("No leads to export with current filters");
        return;
      }

      // Normalize leads for export
      const normalizedLeads = allLeads.map((r: any) => {
        const coursesArr = extractCoursesArray(r, courseMap);
        const joinedCourse =
          coursesArr.length > 0
            ? coursesArr.join(", ")
            : r.course_name ?? r.course ?? "";

        return {
          id: r.id,
          name: r.name ?? "",
          email: r.email ?? "",
          phone: r.phone ?? "",
          course: joinedCourse,
          status: r.status ?? "New",
          contactedOn: (() => {
            if (r.contacted_on) {
              return new Date(r.contacted_on).toLocaleString();
            }
            if (r.created_at) {
              return new Date(r.created_at).toLocaleString();
            }
            return "—";
          })(),
          message: r.message ?? "",
          leadSource: extractLeadSource(r) || "—",
          adminNotes: r.admin_notes ?? r.adminNotes ?? "",
        };
      });

      // Create Excel file
      const wsData = [
        [
          "ID",
          "Name",
          "Email",
          "Phone",
          "Course(s)",
          "Status",
          "Contacted On",
          "Lead Source",
          "Message",
          "Admin Notes",
        ],
        ...normalizedLeads.map(
          (l: {
            id: number;
            name: string;
            email: string;
            phone: string;
            course: string;
            status: string;
            contactedOn: string;
            leadSource: string;
            message: string;
            adminNotes: string;
          }) => [
            l.id,
            l.name,
            l.email,
            l.phone,
            l.course,
            l.status,
            l.contactedOn,
            l.leadSource,
            l.message,
            l.adminNotes,
          ]
        ),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Course Leads");

      // Generate filename with filters if applicable
      const filterParts: string[] = [];
      if (statusFilter) filterParts.push(`status-${statusFilter}`);
      if (courseFilter) {
        const courseName =
          allCourses.find((c) => c.id === courseFilter)?.title || courseFilter;
        filterParts.push(`course-${courseName.replaceAll(/[^a-z0-9]/gi, "_")}`);
      }
      if (dateFrom || dateTo) {
        filterParts.push(`date-${dateFrom || "start"}_to_${dateTo || "end"}`);
      }
      const dateStr = new Date().toISOString().split("T")[0];
      const filename =
        filterParts.length > 0
          ? `Course_Leads_${filterParts.join("_")}_${dateStr}.xlsx`
          : `Course_Leads_${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success(`Exported ${normalizedLeads.length} leads`);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(
        "Failed to export leads: " +
          (err?.response?.data?.message || err?.message || "Unknown error")
      );
    }
  }, [
    debouncedSearch,
    sortBy,
    sortDir,
    statusFilter,
    courseFilter,
    dateFrom,
    dateTo,
    courseMap,
    allCourses,
  ]);

  /* ---------------------------
     Selection helpers
  --------------------------- */
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    const visibleIds = leads.map((l) => l.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    if (allSelected)
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    else
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  }, [leads, selectedIds]);

  /* ---------------------------
     Pagination helper
  --------------------------- */
  function getPageRange(
    current: number,
    last: number,
    delta = 2
  ): (number | "gap")[] {
    if (last <= 0) return [];
    if (last === 1) return [1];

    const range: (number | "gap")[] = [];
    const left = Math.max(1, current - delta);
    const right = Math.min(last, current + delta);

    for (let i = 1; i <= last; i++) {
      if (i === 1 || i === last || (i >= left && i <= right)) {
        range.push(i);
      } else if (range.at(-1) !== "gap") {
        range.push("gap");
      }
    }

    return range;
  }

  /* ---------------------------
     Derived values (memo)
     - improves rendering performance for big lists
  --------------------------- */
  const visibleLeads = useMemo(() => leads, [leads]);

  /* ---------------------------
     Accessibility: polite live region for errors
  --------------------------- */

  /* ---------------------------
     Render
  --------------------------- */
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <section
        className="w-full px-4 sm:px-6 lg:px-8"
        aria-labelledby="page-title"
      >
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1
                id="page-title"
                className="text-3xl font-bold text-gray-800 tracking-tight mb-2"
              >
                Course Leads
              </h1>
              <p className="text-sm text-gray-500">
                Manage leads — filter, export and follow up quickly.
                {totalLeads > 0 && (
                  <span className="ml-2 font-semibold text-gray-800">
                    ({totalLeads} {totalLeads === 1 ? "lead" : "leads"})
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-3.5 top-3.5 text-gray-400 text-sm pointer-events-none" />
                <input
                  aria-label="Search leads"
                  type="text"
                  placeholder="Search by name, email, course..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:border-gray-300"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={downloadExcel}
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:shadow-md hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export all filtered leads to Excel"
                  aria-label="Export leads to Excel"
                >
                  <FaFileDownload />
                  Export
                </button>

                {selectedIds.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="px-5 py-3 bg-red-600 text-white rounded-xl shadow-sm hover:bg-red-700 hover:shadow-md transition-all duration-200 text-sm font-medium cursor-pointer"
                    aria-label={`Delete ${selectedIds.length} selected leads`}
                  >
                    Delete ({selectedIds.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
              <div className="flex flex-col">
                <label
                  htmlFor="statusFilter"
                  className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide"
                >
                  Status
                </label>
                <select
                  id="statusFilter"
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log(
                      "[CourseLeads] Status filter changed:",
                      newValue
                    );
                    setStatusFilter(newValue);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:bg-white"
                >
                  <option value="">All</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="courseFilter"
                  className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide"
                >
                  Course
                </label>
                <select
                  id="courseFilter"
                  aria-label="Filter by course"
                  value={courseFilter}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log(
                      "[CourseLeads] Course filter changed:",
                      newValue
                    );
                    setCourseFilter(newValue);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:bg-white"
                >
                  <option value="">All Courses</option>
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="dateFrom"
                  className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide"
                >
                  From
                </label>
                <input
                  id="dateFrom"
                  aria-label="Filter from date"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log("[CourseLeads] Date From changed:", newValue);
                    setDateFrom(newValue);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:bg-white"
                />
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="dateTo"
                  className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide"
                >
                  To
                </label>
                <input
                  id="dateTo"
                  aria-label="Filter to date"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log("[CourseLeads] Date To changed:", newValue);
                    setDateTo(newValue);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:bg-white"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-end justify-end gap-3">
                <div className="flex flex-col">
                  <label
                    htmlFor="sortBy"
                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2"
                  >
                    Sort
                  </label>
                  <select
                    id="sortBy"
                    value={`${sortBy}:${sortDir}`}
                    onChange={(e) => {
                      const [sb, sd] = e.target.value.split(":");
                      setSortBy(sb);
                      setSortDir(sd as "asc" | "desc");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:bg-white"
                    aria-label="Sort leads"
                  >
                    <option value="id:desc">Newest</option>
                    <option value="id:asc">Oldest</option>
                    <option value="name:asc">Name A → Z</option>
                    <option value="name:desc">Name Z → A</option>
                    <option value="course:asc">Course A → Z</option>
                    <option value="course:desc">Course Z → A</option>
                    <option value="status:asc">Status A → Z</option>
                    <option value="status:desc">Status Z → A</option>
                    <option value="created_at:desc">Contacted Newest</option>
                    <option value="created_at:asc">Contacted Oldest</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="pageSize"
                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    Per page
                  </label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:bg-white"
                    aria-label="Leads per page"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter("");
                    setCourseFilter("");
                    setDateFrom("");
                    setDateTo("");
                    setSearchTerm("");
                    setSortBy("id");
                    setSortDir("desc");
                    setPageSize(20);
                    setCurrentPage(1);
                    setSelectedIds([]);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-200 hover:shadow-sm transition-all duration-200"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden">
          <div className="overflow-x-auto rounded-xl">
            <table
              // className="min-w-full border-collapse"
              className="w-full border-collapse"
              role="table"
              aria-label="Course leads table"
            >
              <thead className="hidden md:table-header-group">
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="py-5 px-3 text-left font-semibold text-xs tracking-wide text-gray-700 first:rounded-tl-xl">
                    <input
                      type="checkbox"
                      aria-label="Select all visible leads"
                      checked={
                        visibleLeads.length > 0 &&
                        visibleLeads.every((l) => selectedIds.includes(l.id))
                      }
                      onChange={toggleSelectAllVisible}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-[#1A3F66] bg-white focus:ring-2 focus:ring-[#1A3F66]/50 cursor-pointer"
                    />
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    ID
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Name
                  </th>
                  {/* <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Email
                  </th> */}

                  <th className="hidden md:table-cell py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Email
                  </th>

                  <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Phone
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Course
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Status
                  </th>
                  {/* <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Lead Source
                  </th> */}

                  <th className="hidden xl:table-cell py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Lead Source
                  </th>

                  {/* <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Contacted On
                  </th> */}

                  <th className="hidden lg:table-cell py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Contacted On
                  </th>

                  <th className="py-2 px-3 text-center font-semibold text-xs tracking-wide text-gray-700 last:rounded-tr-xl">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {loading
                  ? Array.from({ length: Math.min(pageSize, 6) }).map(
                      (_, i) => (
                        <tr
                          key={`skeleton-row-${i}-${pageSize}`}
                          className="animate-pulse"
                        >
                          <td className="py-2 px-3 max-w-[180px] truncate">
                            <div className="h-3.5 w-3.5 bg-gray-200 rounded" />
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate">
                            <div className="h-4 w-6 bg-gray-200 rounded" />
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate">
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate">
                            <div className="h-4 w-28 bg-gray-200 rounded" />
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate">
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate">
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate">
                            <div className="h-5 w-16 bg-gray-200 rounded-full" />
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate">
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                          </td>
                          <td className="py-2 px-3 max-w-[180px] truncate">
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="h-7 w-20 bg-gray-200 rounded-lg" />
                          </td>
                        </tr>
                      )
                    )
                  : (() => {
                      if (visibleLeads.length === 0) {
                        return (
                          <tr>
                            <td colSpan={10} className="py-12 text-center">
                              <div className="flex flex-col items-center justify-center text-gray-400">
                                <svg
                                  className="w-12 h-12 mb-3 opacity-50"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <span className="text-sm font-medium">
                                  No leads found
                                </span>
                                <span className="text-xs mt-1">
                                  Try adjusting your filters
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return visibleLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="text-xs text-gray-700 hover:bg-[#F1F4FB] transition-all duration-200 group"
                        >
                          <td className="py-2 px-3">
                            <input
                              aria-label={`Select lead ${lead.name}`}
                              type="checkbox"
                              checked={selectedIds.includes(lead.id)}
                              onChange={() => toggleSelect(lead.id)}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-[#1A3F66] focus:ring-2 focus:ring-[#1A3F66]/50"
                            />
                          </td>

                          <td className="py-2 px-3 font-medium text-gray-900">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-700 font-semibold text-xs">
                              {lead.id}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-gray-900">
                            {lead.name}
                          </td>

                          {/* <td className="py-2 px-3 text-gray-600">
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:text-[#1A3F66] transition-colors text-xs"
                            >
                              {lead.email}
                            </a>
                          </td> */}

                          <td className="hidden md:table-cell py-2 px-3 text-gray-600">
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:text-[#1A3F66] transition-colors text-xs"
                            >
                              {lead.email}
                            </a>
                          </td>

                          <td className="py-2 px-3 text-gray-600 text-xs">
                            <a
                              href={`tel:${lead.phone}`}
                              className="hover:text-[#1A3F66] transition-colors"
                            >
                              {lead.phone}
                            </a>
                          </td>

                          <td className="py-2 px-3 max-w-[200px]">
                            {(() => {
                              let coursesToShow: string[] = [];
                              if (lead.courses && lead.courses.length > 0) {
                                coursesToShow = lead.courses;
                              } else if (lead.course) {
                                coursesToShow = [lead.course];
                              }

                              if (coursesToShow.length === 0) {
                                return (
                                  <span className="text-gray-400 text-xs">
                                    —
                                  </span>
                                );
                              }
                              if (coursesToShow.length === 1) {
                                return (
                                  <span
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                                    title={coursesToShow[0]}
                                  >
                                    {coursesToShow[0].length > 25
                                      ? `${coursesToShow[0].substring(
                                          0,
                                          25
                                        )}...`
                                      : coursesToShow[0]}
                                  </span>
                                );
                              }

                              // Multiple courses: show first with count
                              const firstCourse = coursesToShow[0];
                              const remainingCount = coursesToShow.length - 1;
                              return (
                                <div className="flex flex-wrap gap-1">
                                  <span
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                                    title={firstCourse}
                                  >
                                    {firstCourse.length > 20
                                      ? `${firstCourse.substring(0, 20)}...`
                                      : firstCourse}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    +{remainingCount}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>

                          <td className="py-2 px-3">
                            {(() => {
                              const status = lead.status ?? "New";
                              const style =
                                STATUS_STYLES[status] ?? STATUS_STYLES["New"];
                              return (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${style.bg} ${style.text}`}
                                >
                                  {status}
                                </span>
                              );
                            })()}
                          </td>

                          {/* <td className="py-2 px-3 text-xs text-gray-600">
                            {lead.leadSource || "—"}
                          </td> */}

                          <td className="hidden xl:table-cell py-2 px-3 text-xs text-gray-600">
                            {lead.leadSource || "—"}
                          </td>


                          <td className="hidden lg:table-cell py-2 px-3 text-xs text-gray-600">
                            {(() => {
                              if (!lead.contactedOn) return "—";
                              try {
                                const date = new Date(lead.contactedOn);
                                if (Number.isNaN(date.getTime())) return "—";
                                return date.toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              } catch {
                                return "—";
                              }
                            })()}
                          </td>

                          <td className="py-2 px-3 text-center">
                            <div
                              className="flex flex-col sm:flex-row gap-2 justify-center items-center"
                              aria-label={`Actions for lead ${lead.name}`}
                            >
                              <button
                                onClick={async () => {
                                  setIsOpen(true);
                                  await fetchLeadDetails(lead.id);
                                }}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#F1F4FB] text-[#1A3F66] hover:bg-[#1A3F66] hover:text-white transition-all duration-200"
                                title={`View ${lead.name}`}
                                aria-label={`View ${lead.name}`}
                              >
                                <FaEye className="text-xs cursor-pointer" />
                              </button>


                              <button
                                onClick={() => deleteLead(lead.id)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 cursor-pointer"
                                title={`Delete ${lead.name}`}
                                aria-label={`Delete ${lead.name}`}
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden p-4">
            {(() => {
              if (loading) return <LoadingSkeleton />;
              if (visibleLeads.length === 0)
                return (
                  <div className="text-center text-slate-500">
                    No leads found.
                  </div>
                );
              return visibleLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="mb-3 bg-white p-4 rounded-xl shadow-sm border border-slate-100"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-slate-800 truncate">
                          {lead.name}
                        </h4>
                        <span className="text-xs text-slate-400">
                          #{lead.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {lead.email}
                      </p>
                      <p className="text-xs text-slate-500">{lead.phone}</p>
                      <div className="text-xs text-slate-600 mt-2">
                        {(() => {
                          let coursesToShow: string[] = [];
                          if (lead.courses && lead.courses.length > 0) {
                            coursesToShow = lead.courses;
                          } else if (lead.course) {
                            coursesToShow = [lead.course];
                          }

                          if (coursesToShow.length === 0)
                            return (
                              <span className="text-slate-400">No course</span>
                            );
                          if (coursesToShow.length === 1) {
                            return (
                              <span
                                className="truncate block"
                                title={coursesToShow[0]}
                              >
                                {coursesToShow[0]}
                              </span>
                            );
                          }
                          return (
                            <div>
                              <span
                                className="truncate block"
                                title={coursesToShow[0]}
                              >
                                {coursesToShow[0]}
                              </span>
                              <span className="text-slate-400">
                                +{coursesToShow.length - 1} more
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {(() => {
                        const status = lead.status ?? "New";
                        const statusStyle =
                          STATUS_STYLES[status] ?? STATUS_STYLES["New"];
                        const className = `${statusStyle.bg} ${statusStyle.text}`;
                        return (
                          <span
                            className={`text-xs px-2 py-1 rounded ${className}`}
                          >
                            {lead.status}
                          </span>
                        );
                      })()}

                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setIsOpen(true);
                            await fetchLeadDetails(lead.id);
                          }}
                          className="p-2 bg-white border rounded-lg"
                          aria-label={`View ${lead.name}`}
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => downloadLeadPDF(lead)}
                          className="p-2 bg-white border rounded-lg"
                          aria-label={`Download ${lead.name} PDF`}
                        >
                          <FaFileDownload />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Pagination */}
          <div className="px-6 py-5 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
            <div className="text-sm text-gray-600" aria-live="polite">
              {totalLeads > 0 ? (
                <>
                  Showing page{" "}
                  <span className="font-semibold text-gray-800">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-800">
                    {totalPages || 1}
                  </span>
                  <span className="ml-2 text-gray-500">
                    ({leads.length} {leads.length === 1 ? "lead" : "leads"} on
                    this page of {totalLeads} total)
                  </span>
                </>
              ) : (
                <span className="text-gray-500">No leads found</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <button
                disabled={currentPage === 1}
                onClick={(e) => {
                  e.preventDefault();
                  const newPage = Math.max(1, currentPage - 1);
                  if (newPage === currentPage) return;
                  console.log(
                    "[CourseLeads] Previous page clicked, changing from",
                    currentPage,
                    "to",
                    newPage
                  );
                  // Clear fetch cache to ensure fresh data for new page
                  lastFetchParamsRef.current = "";
                  setCurrentPage(newPage);
                }}
                className="px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white border border-gray-200 text-gray-700 transition-all duration-200 disabled:hover:bg-transparent"
                aria-label="Previous page"
              >
                <FaChevronLeft />
              </button>

              <nav className="flex items-center gap-1" aria-label="Pagination">
                {getPageRange(currentPage, totalPages || 1).map((p, idx) => {
                  if (p === "gap") {
                    return (
                      <span
                        key={`gap-${idx}-${currentPage}`}
                        className="text-gray-400 px-2"
                      >
                        …
                      </span>
                    );
                  }
                  const pageNum = Number(p);
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (pageNum === currentPage) return; // Don't do anything if clicking current page
                        console.log(
                          "[CourseLeads] Page number clicked, changing from",
                          currentPage,
                          "to",
                          pageNum
                        );
                        // Clear fetch cache to ensure fresh data for new page
                        lastFetchParamsRef.current = "";
                        setCurrentPage(pageNum);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isCurrent
                          ? "bg-[#1A3F66] text-white shadow-sm"
                          : "hover:bg-white border border-gray-200 text-gray-700"
                      }`}
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </nav>

              <button
                disabled={currentPage >= (totalPages || 1)}
                onClick={(e) => {
                  e.preventDefault();
                  const newPage = Math.min(totalPages || 1, currentPage + 1);
                  if (newPage === currentPage) return;
                  console.log(
                    "[CourseLeads] Next page clicked, changing from",
                    currentPage,
                    "to",
                    newPage
                  );
                  // Clear fetch cache to ensure fresh data for new page
                  lastFetchParamsRef.current = "";
                  setCurrentPage(newPage);
                }}
                className="px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white border border-gray-200 text-gray-700 transition-all duration-200 disabled:hover:bg-transparent"
                aria-label="Next page"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {isOpen && selectedLead ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          tabIndex={-1}
          // role="button"
          // aria-label="Close modal
          role="presentation"
          aria-hidden="true"
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all max-h-[90vh] flex flex-col"
            role="dialog"
            aria-labelledby="lead-modal-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex justify-between items-start gap-3 z-10">
              <div>
                <h3
                  id="lead-modal-title"
                  className="text-xl font-bold text-gray-800 tracking-tight"
                >
                  Lead Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  ID #{selectedLead.id}
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Name
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedLead.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Email
                    </span>
                    <p className="text-sm text-gray-700">
                      <a
                        href={`mailto:${selectedLead.email}`}
                        className="text-[#1A3F66] hover:underline"
                      >
                        {selectedLead.email}
                      </a>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Phone
                    </span>
                    <p className="text-sm text-gray-700">
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="text-[#1A3F66] hover:underline"
                      >
                        {selectedLead.phone}
                      </a>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Status
                    </span>
                    <p className="text-sm">
                      {(() => {
                        const status = selectedLead.status || "New";
                        let statusClass = "bg-gray-100 text-gray-600";
                        if (status === "New") {
                          statusClass = "bg-sky-100 text-sky-700";
                        } else if (status === "Contacted") {
                          statusClass = "bg-amber-100 text-amber-700";
                        } else if (status === "Closed") {
                          statusClass = "bg-emerald-100 text-emerald-700";
                        }
                        return (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${statusClass}`}
                          >
                            {status}
                          </span>
                        );
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Lead Source
                    </span>
                    <p className="text-sm text-gray-700">
                      {selectedLead.leadSource || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">
                      Contacted On
                    </span>
                    <p className="text-sm text-gray-700">
                      {selectedLead.contactedOn
                        ? new Date(selectedLead.contactedOn).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Courses */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Courses{" "}
                  {(() => {
                    if (
                      selectedLead.courses &&
                      selectedLead.courses.length > 1
                    ) {
                      return `(${selectedLead.courses.length})`;
                    }
                    return "";
                  })()}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    let coursesToDisplay: string[] = [];
                    if (
                      selectedLead.courses &&
                      selectedLead.courses.length > 0
                    ) {
                      coursesToDisplay = selectedLead.courses;
                    } else if (selectedLead.course) {
                      coursesToDisplay = [selectedLead.course];
                    }

                    if (coursesToDisplay.length === 0) {
                      return (
                        <span className="text-sm text-gray-400 italic">
                          No courses specified
                        </span>
                      );
                    }

                    return coursesToDisplay.map((c) => (
                      <span
                        key={`${selectedLead.id}-${c}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {c}
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Status Update Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus("New")}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  New
                </button>
                <button
                  onClick={() => updateStatus("Contacted")}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Contacted
                </button>
                <button
                  onClick={() => updateStatus("Closed")}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Closed
                </button>
              </div>

              {/* Message */}
              {selectedLead.message && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Message
                  </h4>
                  <div
                    className="p-4 bg-white rounded-lg border-l-4 border-[#1A3F66] text-gray-800 leading-relaxed text-sm"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {selectedLead.message}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <label
                  htmlFor="admin-notes-textarea"
                  className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide"
                >
                  Admin Notes
                </label>
                <textarea
                  id="admin-notes-textarea"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl min-h-[120px] text-sm text-gray-700 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200"
                  placeholder="Add internal notes or remarks about this lead"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 rounded-b-2xl flex justify-between items-center">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  saveAdminNotes();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#1A3F66] text-white font-medium hover:bg-[#163C72] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={
                  !selectedLead ||
                  adminNotes === (selectedLead.admin_notes ?? "") ||
                  savingNotes
                }
              >
                {savingNotes ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Notes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : isOpen ? (
        // Loading state for modal
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          tabIndex={-1}
          aria-label="Close modal"
        >
          <div
            className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div
                className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1A3F66]"
                aria-hidden="true"
              ></div>
              <span className="text-gray-700 font-medium">
                Loading lead details...
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsConfirmOpen(false);
              setConfirmAction(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsConfirmOpen(false);
              setConfirmAction(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsConfirmOpen(false);
                setConfirmAction(null);
              }
            }}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <FaTrash className="text-red-600 text-lg" />
                </div>
                <div>
                  <h3
                    id="confirm-modal-title"
                    className="text-xl font-bold text-gray-900"
                  >
                    {confirmTitle}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              <p className="text-gray-700 leading-relaxed">{confirmMessage}</p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsConfirmOpen(false);
                  setConfirmAction(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction) {
                    confirmAction();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
                aria-label="Confirm deletion"
              >
                <FaTrash className="text-sm" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error live region */}
      <ErrorLive message={error} />
    </div>
  );
}

/* ----------------------------
   Small Loading skeleton copy (kept at bottom)
---------------------------- */
function LoadingSkeleton() {
  const skeletonIds = ["skeleton-1", "skeleton-2", "skeleton-3"];
  return (
    <div className="space-y-3">
      {skeletonIds.map((id) => (
        <div
          key={id}
          className="animate-pulse bg-white rounded-xl p-4 shadow-sm border border-slate-50"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="h-4 w-44 bg-slate-200 rounded mb-2" />
              <div className="h-3 w-72 bg-slate-100 rounded" />
            </div>
            <div className="h-8 w-20 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
