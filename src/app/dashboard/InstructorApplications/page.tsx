"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { api } from "@/utils/axios";
import toast from "react-hot-toast";
import {
  FaSearch,
  FaEye,
  FaTrash,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

type InstructorApplication = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  years_of_experience: string;
  skills: string[];
  message?: string;
  created_at: string;
};

function Detail({
  label,
  value,
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-100">
      <p className="text-slate-500 font-medium text-sm">{label}</p>
      <p className="text-slate-800 text-sm">{value}</p>
    </div>
  );
}

export default function InstructorApplicationsPage() {
  // Data
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<InstructorApplication | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [pageSize, setPageSize] = useState<number>(20);

  // Sorting
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Filters
  const [experienceFilter, setExperienceFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [confirmTitle, setConfirmTitle] = useState<string>("Confirm Deletion");

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef({
    debouncedSearch: "",
    experienceFilter: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "id",
    sortDir: "desc" as "asc" | "desc",
    pageSize: 20,
  });

  // Flag to prevent page sync from triggering re-fetch
  const isSyncingPageRef = useRef(false);

  // Track last fetch params to prevent duplicate fetches
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
     fetchApplications - with pagination, filters, and sorting
  ----------------------------------- */
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const params: Record<string, any> = {
        page: currentPage,
        limit: pageSize,
      };

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
      const trimmedExperience = experienceFilter?.trim();
      if (trimmedExperience) {
        params.experience = trimmedExperience;
      }
      const trimmedDateFrom = dateFrom?.trim();
      if (trimmedDateFrom) {
        params.date_from = trimmedDateFrom;
      }
      const trimmedDateTo = dateTo?.trim();
      if (trimmedDateTo) {
        params.date_to = trimmedDateTo;
      }

      const res = await api.get("/instructor-applications", { params });

      const body = res.data ?? {};
      const data = extractDataArray(body);

      setApplications(data);

      // Pagination metadata
      const backendPage = body.current_page ?? body.page ?? body.currentPage ?? 1;
      const backendTotal = body.total ?? 0;
      const backendTotalPages = body.last_page ?? body.lastPage ?? body.total_pages ?? 1;
      const backendPerPage = body.per_page ?? body.perPage ?? pageSize;

      setTotalPages(Math.max(1, backendTotalPages));
      setTotalApplications(backendTotal);

      // Sync page if out of bounds
      const requestedPage = currentPage;
      const isOutOfBounds = requestedPage > backendTotalPages || requestedPage < 1;

      if (isOutOfBounds && backendPage >= 1 && backendPage <= backendTotalPages) {
        isSyncingPageRef.current = true;
        setCurrentPage(backendPage);
      }

      // Update last fetch params
      const pageForFetchKey = isOutOfBounds ? backendPage : currentPage;
      const fetchKey = JSON.stringify({
        page: pageForFetchKey,
        limit: backendPerPage,
        search: debouncedSearch || "",
        experience: experienceFilter || "",
        dateFrom: dateFrom || "",
        dateTo: dateTo || "",
        sortBy: sortBy || "id",
        sortDir: sortDir || "desc",
      });
      lastFetchParamsRef.current = fetchKey;
    } catch (err: any) {
      console.error("Failed to load applications", err);
      const status = err?.response?.status;
      const errorMessage = err?.response?.data?.message || err?.message || "Unknown error";

      let userMessage: string;
      if (status === 500) {
        userMessage = "Server error. Please check the backend logs or try again later.";
      } else if (status === 401) {
        userMessage = "Unauthorized. Please login again.";
      } else if (status === 404) {
        userMessage = "Applications endpoint not found.";
      } else if (status) {
        userMessage = `Failed to load applications (${status}): ${errorMessage}`;
      } else {
        userMessage = `Failed to load applications: ${errorMessage}`;
      }

      toast.error(userMessage);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    sortBy,
    sortDir,
    experienceFilter,
    dateFrom,
    dateTo,
  ]);

  // Debounce searchTerm -> debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 450);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Single unified effect that handles filters, pagination, and fetching
  useEffect(() => {
    // Skip if we're syncing page
    if (isSyncingPageRef.current) {
      isSyncingPageRef.current = false;
      return;
    }

    const prev = prevFiltersRef.current;
    const current = {
      debouncedSearch,
      experienceFilter,
      dateFrom,
      dateTo,
      sortBy,
      sortDir,
      pageSize,
    };

    // Detect if filters/search/sort/pageSize changed
    const filtersChanged =
      prev.debouncedSearch !== current.debouncedSearch ||
      prev.experienceFilter !== current.experienceFilter ||
      prev.dateFrom !== current.dateFrom ||
      prev.dateTo !== current.dateTo ||
      prev.sortBy !== current.sortBy ||
      prev.sortDir !== current.sortDir ||
      prev.pageSize !== current.pageSize;

    // If filters changed, reset to page 1 BEFORE fetching
    if (filtersChanged) {
      prevFiltersRef.current = current;
      if (currentPage !== 1) {
        setCurrentPage(1);
        lastFetchParamsRef.current = "";
        return;
      }
      lastFetchParamsRef.current = "";
    } else {
      prevFiltersRef.current = current;
    }

    // Create a unique key for this fetch
    const fetchKey = JSON.stringify({
      page: currentPage,
      limit: current.pageSize,
      search: current.debouncedSearch,
      experience: current.experienceFilter,
      dateFrom: current.dateFrom,
      dateTo: current.dateTo,
      sortBy: current.sortBy,
      sortDir: current.sortDir,
    });

    // Skip if we just fetched with these exact same params
    const lastFetch = lastFetchParamsRef.current
      ? JSON.parse(lastFetchParamsRef.current)
      : null;
    const pageChanged = lastFetch && lastFetch.page !== currentPage;

    if (!pageChanged && lastFetchParamsRef.current === fetchKey) {
      return;
    }

    void fetchApplications();
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    experienceFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
    fetchApplications,
  ]);

  /* --------------------------------
     VIEW APPLICATION
  -------------------------------- */
  const handleView = useCallback(async (id: number) => {
    try {
      const res = await api.get(`/instructor-applications/${id}`);
      
      if (res.status === 200 && res.data?.data) {
        setSelectedApplication(res.data.data);
        setIsModalOpen(true);
      }
    } catch (err: any) {
      console.error("Failed to load application:", err);
      toast.error("Failed to load application details");
    }
  }, []);

  /* --------------------------------
     DELETE APPLICATION
  -------------------------------- */
  const handleDelete = useCallback((id: number) => {
    const application = applications.find((app) => app.id === id);
    const appName = application
      ? `${application.first_name} ${application.last_name}`
      : `Application #${id}`;

    // Show custom confirmation modal
    setConfirmTitle("Delete Application");
    setConfirmMessage(
      `Are you sure you want to delete the application from "${appName}"? This action cannot be undone.`
    );
    setConfirmAction(() => async () => {
      setIsConfirmOpen(false);
      setDeletingId(id);
      try {
        const res = await api.delete(`/instructor-applications/${id}`);
        
        if (res.status === 200) {
          toast.success("Application deleted successfully");
          setApplications((prev) => prev.filter((app) => app.id !== id));
          if (selectedApplication?.id === id) {
            setIsModalOpen(false);
            setSelectedApplication(null);
          }
          // Refetch to update pagination
          void fetchApplications();
        }
      } catch (err: any) {
        console.error("Failed to delete application:", err);
        toast.error(err?.response?.data?.message || "Failed to delete application");
      } finally {
        setDeletingId(null);
      }
    });
    setIsConfirmOpen(true);
  }, [applications, selectedApplication, fetchApplications]);

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
     Derived values
  --------------------------- */
  const visibleApplications = useMemo(() => applications, [applications]);

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
                Instructor Applications
              </h1>
              <p className="text-sm text-gray-500">
                Manage instructor applications — filter, view and manage quickly.
                {totalApplications > 0 && (
                  <span className="ml-2 font-semibold text-gray-800">
                    ({totalApplications} {totalApplications === 1 ? "application" : "applications"})
                  </span>
                )}
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3.5 top-3.5 text-gray-400 text-sm pointer-events-none" />
              <input
                aria-label="Search applications"
                type="text"
                placeholder="Search by name, email, phone, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:border-gray-300"
              />
            </div>
          </div>

          {/* Filters Section */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
              <div className="flex flex-col">
                <label
                  htmlFor="experienceFilter"
                  className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide"
                >
                  Experience
                </label>
                <select
                  id="experienceFilter"
                  aria-label="Filter by experience"
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:bg-white"
                >
                  <option value="">All</option>
                  <option value="0-1">0-1 years</option>
                  <option value="2-3">2-3 years</option>
                  <option value="4-5">4-5 years</option>
                  <option value="6+">6+ years</option>
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
                  onChange={(e) => setDateFrom(e.target.value)}
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
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] focus:outline-none transition-all duration-200 hover:bg-white"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 flex items-end justify-end gap-3">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="sortBy"
                    className="text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap"
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
                    aria-label="Sort applications"
                  >
                    <option value="id:desc">Newest</option>
                    <option value="id:asc">Oldest</option>
                    <option value="first_name:asc">Name A → Z</option>
                    <option value="first_name:desc">Name Z → A</option>
                    <option value="created_at:desc">Applied Newest</option>
                    <option value="created_at:asc">Applied Oldest</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
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
                    aria-label="Applications per page"
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
                    setExperienceFilter("");
                    setDateFrom("");
                    setDateTo("");
                    setSearchTerm("");
                    setSortBy("id");
                    setSortDir("desc");
                    setPageSize(20);
                    setCurrentPage(1);
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
              className="w-full border-collapse"
              role="table"
              aria-label="Instructor applications table"
            >
              <thead className="hidden md:table-header-group">
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="py-5 px-3 text-left font-semibold text-xs tracking-wide text-gray-700 first:rounded-tl-xl">
                    ID
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Name
                  </th>
                  <th className="hidden md:table-cell py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Email
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Phone
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Experience
                  </th>
                  <th className="py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Skills
                  </th>
                  <th className="hidden lg:table-cell py-2 px-3 text-left font-semibold text-xs tracking-wide text-gray-700">
                    Applied On
                  </th>
                  <th className="py-2 px-3 text-center font-semibold text-xs tracking-wide text-gray-700 last:rounded-tr-xl">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-100">
                {loading
                  ? Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                      <tr key={`skeleton-row-${i}`} className="animate-pulse">
                        <td className="py-2 px-3">
                          <div className="h-4 w-6 bg-gray-200 rounded" />
                        </td>
                        <td className="py-2 px-3">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                        </td>
                        <td className="hidden md:table-cell py-2 px-3">
                          <div className="h-4 w-28 bg-gray-200 rounded" />
                        </td>
                        <td className="py-2 px-3">
                          <div className="h-4 w-20 bg-gray-200 rounded" />
                        </td>
                        <td className="py-2 px-3">
                          <div className="h-4 w-16 bg-gray-200 rounded" />
                        </td>
                        <td className="py-2 px-3">
                          <div className="h-4 w-20 bg-gray-200 rounded" />
                        </td>
                        <td className="hidden lg:table-cell py-2 px-3">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="h-7 w-20 bg-gray-200 rounded-lg" />
                        </td>
                      </tr>
                    ))
                  : (() => {
                      if (visibleApplications.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-12 text-center">
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
                                  No applications found
                                </span>
                                <span className="text-xs mt-1">
                                  Try adjusting your filters
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                      return visibleApplications.map((app) => (
                        <tr
                          key={app.id}
                          className="text-xs text-gray-700 hover:bg-[#F1F4FB] transition-all duration-200 group"
                        >
                          <td className="py-2 px-3 font-medium text-gray-900">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-gray-700 font-semibold text-xs">
                              {app.id}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-gray-900">
                            {app.first_name} {app.last_name}
                          </td>
                          <td className="hidden md:table-cell py-2 px-3 text-gray-600">
                            <a
                              href={`mailto:${app.email}`}
                              className="hover:text-[#1A3F66] transition-colors text-xs"
                            >
                              {app.email}
                            </a>
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-xs">
                            <a
                              href={`tel:${app.phone}`}
                              className="hover:text-[#1A3F66] transition-colors"
                            >
                              {app.phone}
                            </a>
                          </td>
                          <td className="py-2 px-3 text-gray-600 text-xs">
                            {app.years_of_experience}
                          </td>
                          <td className="py-2 px-3 max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(app.skills) ? (
                                <>
                                  {app.skills.slice(0, 2).map((skill, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {app.skills.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{app.skills.length - 2}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </div>
                          </td>
                          <td className="hidden lg:table-cell py-2 px-3 text-xs text-gray-600">
                            {app.created_at
                              ? new Date(app.created_at).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div
                              className="inline-flex flex-nowrap gap-2 justify-center items-center"
                              aria-label={`Actions for application ${app.id}`}
                            >
                              <button
                                onClick={() => handleView(app.id)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#F1F4FB] text-[#1A3F66] hover:bg-[#1A3F66] hover:text-white transition-all duration-200"
                                title={`View ${app.first_name} ${app.last_name}`}
                                aria-label={`View ${app.first_name} ${app.last_name}`}
                              >
                                <FaEye className="text-xs" />
                              </button>
                              <button
                                onClick={() => handleDelete(app.id)}
                                disabled={deletingId === app.id}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                                title={`Delete ${app.first_name} ${app.last_name}`}
                                aria-label={`Delete ${app.first_name} ${app.last_name}`}
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

          {/* Pagination */}
          <div className="px-6 py-5 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
            <div className="text-sm text-gray-600" aria-live="polite">
              {totalApplications > 0 ? (
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
                    ({applications.length} {applications.length === 1 ? "application" : "applications"} on
                    this page of {totalApplications} total)
                  </span>
                </>
              ) : (
                <span className="text-gray-500">No applications found</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <button
                disabled={currentPage === 1}
                onClick={(e) => {
                  e.preventDefault();
                  const newPage = Math.max(1, currentPage - 1);
                  if (newPage === currentPage) return;
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
                        if (pageNum === currentPage) return;
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

      {/* View Modal */}
      {isModalOpen && selectedApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              setSelectedApplication(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsModalOpen(false);
              setSelectedApplication(null);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="application-modal-title"
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsModalOpen(false);
                setSelectedApplication(null);
              }
            }}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex justify-between items-start gap-3 z-10">
              <div>
                <h3
                  id="application-modal-title"
                  className="text-xl font-bold text-gray-800 tracking-tight"
                >
                  Application Details
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  ID #{selectedApplication.id}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedApplication(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Detail label="First Name" value={selectedApplication.first_name} />
                  <Detail label="Last Name" value={selectedApplication.last_name} />
                  <Detail
                    label="Email"
                    value={
                      <a
                        href={`mailto:${selectedApplication.email}`}
                        className="text-[#1A3F66] hover:underline"
                      >
                        {selectedApplication.email}
                      </a>
                    }
                  />
                  <Detail
                    label="Phone"
                    value={
                      <a
                        href={`tel:${selectedApplication.phone}`}
                        className="text-[#1A3F66] hover:underline"
                      >
                        {selectedApplication.phone}
                      </a>
                    }
                  />
                  <Detail
                    label="Years of Experience"
                    value={selectedApplication.years_of_experience}
                  />
                  <Detail
                    label="Applied On"
                    value={
                      selectedApplication.created_at
                        ? new Date(selectedApplication.created_at).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"
                    }
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(selectedApplication.skills) ? (
                    selectedApplication.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-lg font-medium"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic">No skills specified</span>
                  )}
                </div>
              </div>

              {selectedApplication.message && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Message
                  </h4>
                  <div
                    className="p-4 bg-white rounded-lg border-l-4 border-[#1A3F66] text-gray-800 leading-relaxed text-sm"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {selectedApplication.message}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedApplication(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-200"
              >
                Close
              </button>
              <button
                onClick={() => handleDelete(selectedApplication.id)}
                disabled={deletingId === selectedApplication.id}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingId === selectedApplication.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FaTrash className="text-sm" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
