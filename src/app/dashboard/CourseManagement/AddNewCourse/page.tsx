"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/utils/axios"; // your axios instance (baseURL -> http://localhost:8000/api)
import { uploadToCloudinary } from "@/services/cloudinaryUpload";
import {
  AdminCard,
  AdminInput,
  AdminTextarea,
} from "../../AllPages/CorporateTraining/components/AdminUI";

/**
 * AddNewCoursePage (Step 1 -> Step 2)
 *
 * - New course: POST /courses (multipart/form-data) -> returns { id }
 * - Edit course: PUT /courses/{id} and PUT /course-details/{id}
 * - Step 2: POST /course-details or PUT /course-details/{id}
 *
 * NOTE:
 *  - backend must accept file input named 'image' and/or image URL string in body.
 *  - adjust axios baseURL if needed (src/utils/api.ts).
 */

function AddNewCoursePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<number>(1);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Step 1 fields (courses table)
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState("");
  const [students, setStudents] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("none");
  const [mode, setMode] = useState("active");

  // All categories for dropdown (id + name)
  const [allCategories, setAllCategories] = useState<Array<{ id: number; name: string }>>([]);

  const fetchAllCategories = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      const data = res.data ?? [];
      // support paginated or { data: [...] } shapes
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setAllCategories(list);
    } catch (e) {
      console.error("Failed to load categories for dropdown:", e);
    }
  }, []);

  // Step 2 fields - Dynamic arrays for better UX
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");

  // Agenda: array of weeks with title and description
  const [agendaWeeks, setAgendaWeeks] = useState([
    { id: `week-${Date.now()}`, week: 1, title: "", description: "" },
  ]);

  // Trainers: array of trainer objects with name and role
  const [trainers, setTrainers] = useState([
    { id: `trainer-${Date.now()}`, name: "", role: "" },
  ]);

  // Why Choose Us: array of cards with title and description
  const [whyChooseCards, setWhyChooseCards] = useState([
    { id: `card-${Date.now()}`, title: "", description: "" },
  ]);

  // Why Choose section title + description (matches UI in screenshot)
  const [whyChooseTitle, setWhyChooseTitle] = useState(
    "Why Choose Our Program?"
  );
  const [whyChooseDescription, setWhyChooseDescription] = useState("");

  // Who Should Join: array of bullet points
  const [whoShouldJoinItems, setWhoShouldJoinItems] = useState([
    { id: `item-${Date.now()}`, text: "" },
  ]);

  // Who Should Join section title + description
  const [whoJoinTitle, setWhoJoinTitle] = useState("Who Should Join?");
  const [whoJoinDescription, setWhoJoinDescription] = useState("");

  // Key Outcomes: array of items with icon and text
  const [keyOutcomesItems, setKeyOutcomesItems] = useState([
    { id: `outcome-${Date.now()}`, title: "", description: "" },
  ]);

  // Key outcomes section title + optional description
  const [keyOutcomesTitle, setKeyOutcomesTitle] = useState(
    "Key Learning Outcomes"
  );
  const [keyOutcomesDescription, setKeyOutcomesDescription] = useState("");

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");

  // loading states
  const [savingStep1, setSavingStep1] = useState(false);
  const [savingStep2, setSavingStep2] = useState(false);

  // file input ref
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Helper: try multiple keys on an object and return the first non-empty value
  function pickFirst<T = any>(obj: Record<string, any> | undefined | null, keys: string[]): T | undefined {
    if (!obj) return undefined;
    for (const k of keys) {
      if (Object.hasOwn(obj, k)) {
        const v = obj[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return v as T;
      }
    }
    return undefined;
  }

  // Resolve image URL: accepts string or object (cloudinary-style) and returns a usable URL
  function resolveImageUrl(img?: any) {
    const fallback = "/default-uploads/default-course.png";
    if (!img) return fallback;
    // support image as object (returned by some upload APIs)
    if (typeof img === "object" && img !== null) {
      // try common properties
      const imgObj = img as Record<string, unknown>;
      const maybe = (imgObj.url || imgObj.secure_url || imgObj.path || imgObj.file || imgObj.image) as string | undefined;
      if (maybe) img = maybe;
      else return fallback;
    }
    if (typeof img === "string" && /^https?:\/\//i.test(img)) return img;
    // If the image path does not start with '/', prepend '/storage/'
    const path = (typeof img === "string" && img.startsWith("/")) ? img : `/storage/${img}`;
    const base = (api.defaults.baseURL || "").replace(/\/?api\/?$/i, "");
    const url = base + path;
    console.debug("[AddNewCourse] course.image=", img, "resolved=", url);
    return url;
  }

  // (moved) Load course data if courseId is in URL (edit mode)

  // Helper function to load course and course-details data
  const loadCourseData = useCallback(async (id: number) => {
    try {
      setLoadingData(true);

      // Fetch course data
      const courseRes = await api.get(`/courses/${id}`);
      // Handle different API response formats: { success: true, course: {...} } or { data: {...} } or direct object
      let course = null;
      if (courseRes.data?.success && courseRes.data?.course) {
        // Format: { success: true, course: {...} }
        course = courseRes.data.course;
      } else if (courseRes.data?.course) {
        // Format: { course: {...} }
        course = courseRes.data.course;
      } else if (courseRes.data?.data) {
        // Format: { data: {...} }
        course = courseRes.data.data;
      } else {
        // Format: { ... } (direct object)
        course = courseRes.data;
      }

      // Debug: log fetched course shape to help diagnose edit-population issues
      console.debug("[AddNewCourse] loadCourseData - fetched course:", course);

      if (!course) {
        console.error("[AddNewCourse] No course data received");
        toast.error("Failed to load course data");
        setLoadingData(false);
        return;
      }

      // Populate Step 1 fields (be tolerant to various API response shapes / key names)
      // Try some likely key names for each field
      const titleVal = pickFirst<string>(course, ["title", "name", "course_title", "courseName", "courseTitle"]) || "";
      const descVal = pickFirst<string>(course, ["description", "desc", "course_description"]) || "";
      const priceVal = pickFirst<number | string>(course, ["price", "cost"]) ?? "";
      const ratingVal = pickFirst<number | string>(course, ["rating"]) ?? "";
      const studentsVal = pickFirst<number | string>(course, ["students", "student_count", "enrolled_count"]) ?? "";
      const categoryVal = pickFirst<number | string>(course, ["category_id", "categoryId", "category"]) ?? "";
      const statusVal = pickFirst<string>(course, ["status"]) || "none";
      const modeVal = pickFirst<string>(course, ["mode"]) || "active";
      const imageVal = pickFirst<any>(course, ["image", "banner", "thumbnail", "image_url", "imageUrl"]);

      setTitle(String(titleVal || ""));
      setDescription(String(descVal || ""));
      setPrice(priceVal !== "" && priceVal != null ? String(priceVal) : "");
      setRating(ratingVal !== "" && ratingVal != null ? String(ratingVal) : "");
      setStudents(studentsVal !== "" && studentsVal != null ? String(studentsVal) : "");
      setCategoryId(categoryVal !== "" && categoryVal != null ? String(categoryVal) : "");
      setStatus(statusVal || "none");
      setMode(modeVal || "active");
      if (imageVal) {
        setImagePreview(resolveImageUrl(imageVal)); // normalize relative paths to absolute
      }

      console.debug("[AddNewCourse] Step 1 fields populated:", {
        title: titleVal,
        description: descVal,
        price: priceVal,
        categoryId: categoryVal,
        status: statusVal,
        mode: modeVal
      });

      // Fetch course-details data
      try {
        const detailsRes = await api.get(`/course-details?course_id=${id}`);
        // Handle different API response formats
        let details = null;
        if (detailsRes.data?.success && detailsRes.data?.data) {
          // Format: { success: true, data: [...] }
          details = Array.isArray(detailsRes.data.data) ? detailsRes.data.data[0] : detailsRes.data.data;
        } else if (Array.isArray(detailsRes.data)) {
          // Format: [...]
          details = detailsRes.data[0];
        } else if (detailsRes.data?.data) {
          // Format: { data: [...] }
          details = Array.isArray(detailsRes.data.data) ? detailsRes.data.data[0] : detailsRes.data.data;
        } else {
          // Format: { ... } (single object)
          details = detailsRes.data;
        }

        // Debug: log fetched course-details shape for easier debugging when fields don't populate
        console.debug("[AddNewCourse] loadCourseData - fetched course-details:", details);

        if (details) {
          // Populate Step 2 fields
          setSubtitle(details.subtitle || "");
          setSlug(details.slug || "");
          setWhyChooseTitle(details.why_choose_title || "Why Choose Our Program?");
          setWhyChooseDescription(details.why_choose_description || "");
          setWhoJoinTitle(details.who_join_title || "Who Should Join?");
          setWhoJoinDescription(details.who_join_description || "");
          setKeyOutcomesTitle(details.key_outcomes_title || "Key Learning Outcomes");
          setKeyOutcomesDescription(details.key_outcomes_description || "");
          setMetaTitle(details.meta_title || "");
          setMetaDescription(details.meta_description || "");
          setMetaKeywords(details.meta_keywords || "");

          // Load trainers
          if (details.trainers && Array.isArray(details.trainers) && details.trainers.length > 0) {
            setTrainers(
              details.trainers.map((t: Record<string, string>, idx: number) => ({
                id: `trainer-${idx}`,
                name: t.name || "",
                role: t.role || "",
              }))
            );
          }

          // Load agenda
          if (details.agenda && Array.isArray(details.agenda) && details.agenda.length > 0) {
            setAgendaWeeks(
              details.agenda.map((w: Record<string, string | number>, idx: number) => ({
                id: `week-${idx}`,
                week: (w.week as number) || idx + 1,
                title: (w.title as string) || "",
                description: (w.content as string) || "",
              }))
            );
          }

          // Load why choose cards
          if (details.why_choose && Array.isArray(details.why_choose) && details.why_choose.length > 0) {
            setWhyChooseCards(
              details.why_choose.map((c: Record<string, string>, idx: number) => ({
                id: `card-${idx}`,
                title: c.title || "",
                description: c.description || "",
              }))
            );
          }

          // Load who should join items
          if (details.who_should_join && Array.isArray(details.who_should_join) && details.who_should_join.length > 0) {
            setWhoShouldJoinItems(
              details.who_should_join.map((item: Record<string, string> | string, idx: number) => ({
                id: `item-${idx}`,
                text: (typeof item === 'string' ? item : item.text) || "",
              }))
            );
          }

          // Load key outcomes
          if (details.key_outcomes && Array.isArray(details.key_outcomes) && details.key_outcomes.length > 0) {
            setKeyOutcomesItems(
              details.key_outcomes.map((o: Record<string, string>, idx: number) => ({
                id: `outcome-${idx}`,
                title: o.title || "",
                description: o.description || "",
              }))
            );
          }

          setDetailsSaved(true);
          toast.success("Course data loaded successfully");
        } else {
          console.warn("[AddNewCourse] No course details found for course ID:", id);
        }
      } catch (err) {
        console.warn("Failed to load course-details:", err);
        // Continue without details (Step 2 will be empty)
      }

      setLoadingData(false);
    } catch (err: unknown) {
      console.error("Failed to load course data:", err);
      let message = "Failed to load course data";
      if (err && typeof err === "object" && "response" in err) {
        const errorObj = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        message =
          errorObj.response?.data?.message ||
          errorObj.response?.data?.error ||
          message;
      }
      toast.error(message);
      setLoadingData(false);
    }
  }, []);

  // Load course data if courseId is in URL (edit mode)
  useEffect(() => {
    const urlCourseId = searchParams.get("courseId");
    if (urlCourseId) {
      const id = Number(urlCourseId);
      setCourseId(id);
      setIsEditMode(true);
      loadCourseData(id);
    }
    // Always fetch categories for the dropdown on mount
    void fetchAllCategories();
  }, [searchParams, loadCourseData, fetchAllCategories]);

  // Warn user if they try to leave before completing Step 2
  React.useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (courseId && !detailsSaved) {
        e.preventDefault();
        // BeforeUnloadEvent.returnValue is deprecated but still needed for browser compatibility
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        e.returnValue = "You have an incomplete course (Step 1 saved). Complete Step 2 or Clear to discard.";
        return "You have an incomplete course (Step 1 saved). Complete Step 2 or Clear to discard.";
      }
      return undefined;
    }

    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        globalThis.window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }
    return undefined;
  }, [courseId, detailsSaved]);

  // preview helper
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }

  // Option: use BannerBox component if you have it, but I'll wire a simple upload handler here:
  function triggerFilePicker() {
    fileRef.current?.click();
  }

  // -------------------------
  // STEP 1: create or update course
  // -------------------------
  async function handleSaveStep1() {
    if (!title.trim()) {
      toast.error("Course title is required");
      return;
    }

    try {
      // Prevent duplicate course titles (only check for new courses)
      if (!isEditMode) {
        try {
          const listRes = await api.get("/courses");
          const existingArr = Array.isArray(listRes.data) ? listRes.data : listRes.data?.data || [];
          const conflict = existingArr.find((c: { title?: string }) => (c.title || "").trim().toLowerCase() === title.trim().toLowerCase());
          if (conflict) {
            toast.error("A course with the same title already exists. Please choose a different title.");
            return;
          }
        } catch {
          // ignore errors from listing (backend may not support filters) and continue to create
        }
      }

      setSavingStep1(true);

      // Upload image to Cloudinary if a new file was selected
      let cloudinaryUrl = imagePreview;
      if (imageFile) {
        try {
          toast.loading("Uploading image to Cloudinary...");
          const result = await uploadToCloudinary(imageFile);
          cloudinaryUrl = result.secure_url; // Use secure_url for backward compatibility
          toast.dismiss();
          toast.success("Image uploaded successfully");
        } catch {
          toast.dismiss();
          toast.error("Failed to upload image to Cloudinary");
          setSavingStep1(false);
          return;
        }
      }

      // Build JSON payload with Cloudinary URL
      const payload: {
        title: string;
        description: string;
        status: string;
        mode: string;
        price?: number;
        rating?: number;
        students?: number;
        category_id?: number;
        image?: string;
      } = {
        title,
        description,
        status: status ?? "none",
        mode: mode ?? "active",
      };

      if (price !== "") payload.price = Number.parseFloat(price);
      if (rating !== "") payload.rating = Number.parseFloat(rating);
      if (students !== "") payload.students = Number.parseInt(students, 10);
      if (categoryId !== "") payload.category_id = Number.parseInt(categoryId, 10);

      // Include the Cloudinary URL as a string (not FormData)
      if (cloudinaryUrl) {
        payload.image = cloudinaryUrl;
      }

      if (isEditMode && courseId) {
        // UPDATE existing course
        await api.put(`/courses/${courseId}`, payload);
        toast.success("Step 1 updated successfully");
      } else {
        // CREATE new course
        const res = await api.post("/courses", payload);

        // backend should return { id: <course_id> }
        const id = res.data.id ?? res.data?.data?.id ?? null;
        if (!id) {
          toast.error("Unexpected response from server (missing id).");
          setSavingStep1(false);
          return;
        }

        setCourseId(Number(id));
        setDetailsSaved(false);
        toast.success("Step 1 saved");
        toast("Please complete Step 2 to finish adding this course. You can click Clear to discard.");
      }

      setStep(2);
    } catch (err: unknown) {
      console.error("save step1 err:", err);
      let message = "Failed to save Step 1";
      if (err && typeof err === "object" && "response" in err) {
        const errorObj = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        message =
          errorObj.response?.data?.message ||
          errorObj.response?.data?.error ||
          message;
      }
      toast.error(message);
    } finally {
      setSavingStep1(false);
    }
  }

  // -------------------------
  // STEP 2: save or update course details
  // -------------------------
  async function handleSaveStep2() {
    if (!courseId) {
      toast.error("Missing course id. Save Step 1 first.");
      return;
    }
  
    const safeSubtitle = subtitle.trim();
    if (!safeSubtitle) {
      toast.error("Subtitle is required in Step 2");
      return;
    }
  
    try {
      setSavingStep2(true);
  
      const payload = {
        course_id: courseId,
  
        // ✅ REQUIRED
        subtitle: safeSubtitle,
  
        // ✅ nullable
        slug: slug.trim() || null,
  
        why_choose_title: whyChooseTitle || null,
        why_choose_description: whyChooseDescription || null,
  
        who_should_join_title: whoJoinTitle || null,
        who_should_join_description: whoJoinDescription || null,
  
        key_outcomes_title: keyOutcomesTitle || null,
        key_outcomes_description: keyOutcomesDescription || null,
  
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        meta_keywords: metaKeywords || null,
  
        // ✅ ALWAYS ARRAYS (never null)
        trainers: trainers.filter(t => t.name.trim()),
  
        agenda: agendaWeeks
          .filter(w => w.title.trim())
          .map(w => ({
            week: w.week,
            title: w.title,
            content: w.description,
          })),
  
        why_choose: whyChooseCards.filter(c => c.title.trim()),
  
        who_should_join: whoShouldJoinItems
          .filter(i => i.text.trim())
          .map(i => i.text),
  
        key_outcomes: keyOutcomesItems.filter(o => o.title.trim()),
      };
  
      await api.post("/course-details", payload, {
        headers: { "Content-Type": "application/json" },
      });
  
      toast.success("Course saved successfully!");
      setDetailsSaved(true);
      router.push("/dashboard/CourseManagement/AllCourses");
  
    } catch (err: any) {
      console.error("422 validation errors:", err.response?.data?.errors);
      toast.error("Validation failed – check console");
    } finally {
      setSavingStep2(false);
    }
  }
  

  return (
    <>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">{isEditMode ? "Edit Course" : "Add New Course"}</h1>

        {loadingData ? (
          <div className="p-8 text-center text-gray-500">Loading course data...</div>
        ) : (
          <>
            {/* ---------------------- STEP 1 UI ---------------------- */}
            {step === 1 && (
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <AdminCard title="Course Basic Information">
                  <div className="space-y-4">
                    <AdminInput
                      label="Course Title*"
                      value={title}
                      onChange={setTitle}
                    />

                    <AdminTextarea
                      label="Course Description"
                      value={description}
                      onChange={setDescription}
                      rows={4}
                    />

                    {/* Image upload preview + input */}
                    <div className="space-y-2">
                      <label htmlFor="course-image-upload" className="block text-gray-700 font-semibold">
                        Course Banner Image
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={triggerFilePicker}
                          className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer"
                        >
                          Upload Image
                        </button>

                        <input
                          id="course-image-upload"
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />

                        {imagePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePreview}
                            alt="Course preview"
                            className="h-16 w-16 rounded-lg object-cover border"
                            onError={(e) => {
                              // fallback to default placeholder if loading fails
                              (e.currentTarget as HTMLImageElement).src = "/default-uploads/default-course.png";
                            }}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg border flex items-center justify-center text-sm text-gray-400">
                            Preview
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AdminInput label="Price" value={price} onChange={setPrice} />
                      <AdminInput
                        label="Rating"
                        value={rating}
                        onChange={setRating}
                      />
                      <AdminInput
                        label="Students"
                        value={students}
                        onChange={setStudents}
                      />
                      <div>
                        <label htmlFor="category-select" className="block text-gray-600 font-semibold mb-2">Category</label>
                        <select
                          id="category-select"
                          className="w-full border rounded-lg px-3 py-2"
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                        >
                          <option value="">-- Select category --</option>
                          {allCategories.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.name} ({c.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="status-select" className="block text-gray-600 font-semibold mb-2">
                          Status
                        </label>
                        <select
                          id="status-select"
                          className="w-full border rounded-lg px-3 py-2"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          <option value="none">None</option>
                          <option value="trending">Trending</option>
                          <option value="popular">Popular</option>
                          <option value="free">Free</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="mode-select" className="block text-gray-600 font-semibold mb-2">
                          Mode
                        </label>
                        <select
                          id="mode-select"
                          className="w-full border rounded-lg px-3 py-2"
                          value={mode}
                          onChange={(e) => setMode(e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </AdminCard>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveStep1}
                    className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={savingStep1}
                  >
                    {(() => {
                      if (savingStep1) return "Saving...";
                      if (isEditMode) return "Update & Next →";
                      return "Save & Next →";
                    })()}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      // If a course was created but step2 not saved, delete the incomplete course so user can navigate away
                      if (courseId && !detailsSaved && !isEditMode) {
                        try {
                          await api.delete(`/courses/${courseId}`);
                          toast.success("Incomplete course discarded.");
                        } catch {
                          // ignore server errors but still clear local state
                          toast("Cleared locally; server delete failed or not available.");
                        }
                        setCourseId(null);
                        setDetailsSaved(false);
                        setStep(1);
                      }

                      // clear form (optional)
                      setTitle("");
                      setDescription("");
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="px-6 py-3 bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </form>
            )}

            {/* ---------------------- STEP 2 UI ---------------------- */}
            {step === 2 && (
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Course Details */}
                <AdminCard title="Course Details">
                  <AdminInput
                    label="Subtitle"
                    value={subtitle}
                    onChange={setSubtitle}
                  />
                  <AdminInput
                    label="URL Slug (optional - auto-generated from course title if empty)"
                    value={slug}
                    onChange={setSlug}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used in course URL: /course-details/[slug]. Leave empty to auto-generate from course title.
                  </p>
                </AdminCard>

                {/* Trainers Section */}
                <AdminCard title="Trainers">
                  <div className="space-y-4">
                    {trainers.map((trainer, idx) => (
                      <div
                        key={trainer.id}
                        className="p-4 border border-gray-300 rounded-lg space-y-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Trainer {idx + 1}</h4>
                          {trainers.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setTrainers(
                                  trainers.filter((t) => t.id !== trainer.id)
                                )
                              }
                              className="text-red-600 text-sm hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Trainer Name"
                          value={trainer.name}
                          onChange={(e) =>
                            setTrainers(
                              trainers.map((t) =>
                                t.id === trainer.id
                                  ? { ...t, name: e.target.value }
                                  : t
                              )
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Role/Title (e.g., Senior Developer)"
                          value={trainer.role}
                          onChange={(e) =>
                            setTrainers(
                              trainers.map((t) =>
                                t.id === trainer.id
                                  ? { ...t, role: e.target.value }
                                  : t
                              )
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setTrainers([
                          ...trainers,
                          { id: `trainer-${Date.now()}`, name: "", role: "" },
                        ])
                      }
                      className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer"
                    >
                      + Add Trainer
                    </button>
                  </div>
                </AdminCard>

                {/* Agenda/Weeks Section */}
                <AdminCard title="7-Weeks Training Agenda">
                  <div className="space-y-4">
                    {agendaWeeks.map((week, idx) => (
                      <div
                        key={week.id}
                        className="p-4 border border-gray-300 rounded-lg space-y-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Week {idx + 1}</h4>
                          {agendaWeeks.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setAgendaWeeks(
                                  agendaWeeks.filter((w) => w.id !== week.id)
                                )
                              }
                              className="text-red-600 text-sm hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Week Title (e.g., PHP Basics)"
                          value={week.title}
                          onChange={(e) =>
                            setAgendaWeeks(
                              agendaWeeks.map((w) =>
                                w.id === week.id
                                  ? { ...w, title: e.target.value }
                                  : w
                              )
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <textarea
                          placeholder="Week Description/Content"
                          value={week.description}
                          onChange={(e) =>
                            setAgendaWeeks(
                              agendaWeeks.map((w) =>
                                w.id === week.id
                                  ? { ...w, description: e.target.value }
                                  : w
                              )
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setAgendaWeeks([
                          ...agendaWeeks,
                          {
                            id: `week-${Date.now()}`,
                            week: agendaWeeks.length + 1,
                            title: "",
                            description: "",
                          },
                        ])
                      }
                      className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer"
                    >
                      + Add Week
                    </button>
                  </div>
                </AdminCard>

                {/* Why Choose Us Section */}
                <AdminCard title="Why Choose Us? (Cards)">
                  <div className="space-y-4">
                    <AdminInput
                      label="Section Title"
                      value={whyChooseTitle}
                      onChange={setWhyChooseTitle}
                    />
                    <AdminTextarea
                      label="Section Description"
                      value={whyChooseDescription}
                      onChange={setWhyChooseDescription}
                      rows={3}
                    />
                    {whyChooseCards.map((card, idx) => (
                      <div
                        key={card.id}
                        className="p-4 border border-gray-300 rounded-lg space-y-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Card {idx + 1}</h4>
                          {whyChooseCards.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setWhyChooseCards(
                                  whyChooseCards.filter((c) => c.id !== card.id)
                                )
                              }
                              className="text-red-600 text-sm hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Card Title (e.g., Strong Fundamentals)"
                          value={card.title}
                          onChange={(e) =>
                            setWhyChooseCards(
                              whyChooseCards.map((c) =>
                                c.id === card.id
                                  ? { ...c, title: e.target.value }
                                  : c
                              )
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <textarea
                          placeholder="Card Description"
                          value={card.description}
                          onChange={(e) =>
                            setWhyChooseCards(
                              whyChooseCards.map((c) =>
                                c.id === card.id
                                  ? { ...c, description: e.target.value }
                                  : c
                              )
                            )
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setWhyChooseCards([
                          ...whyChooseCards,
                          { id: `card-${Date.now()}`, title: "", description: "" },
                        ])
                      }
                      className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer"
                    >
                      Add Card
                    </button>
                  </div>
                </AdminCard>

                {/* Who Should Join Section */}
                <AdminCard title="Who Should Join? (Bullet Points)">
                  <div className="space-y-4">
                    <AdminInput
                      label="Section Title"
                      value={whoJoinTitle}
                      onChange={setWhoJoinTitle}
                    />
                    <AdminTextarea
                      label="Section Description"
                      value={whoJoinDescription}
                      onChange={setWhoJoinDescription}
                      rows={3}
                    />
                    {whoShouldJoinItems.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Add a point (e.g., Beginners wanting to learn backend)"
                          value={item.text}
                          onChange={(e) =>
                            setWhoShouldJoinItems(
                              whoShouldJoinItems.map((i) =>
                                i.id === item.id
                                  ? { ...i, text: e.target.value }
                                  : i
                              )
                            )
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        {whoShouldJoinItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setWhoShouldJoinItems(
                                whoShouldJoinItems.filter((i) => i.id !== item.id)
                              )
                            }
                            className="text-red-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setWhoShouldJoinItems([
                          ...whoShouldJoinItems,
                          { id: `item-${Date.now()}`, text: "" },
                        ])
                      }
                      className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer"
                    >
                      + Add Point
                    </button>
                  </div>
                </AdminCard>

                {/* Key Outcomes Section */}
                <AdminCard title="Key Learning Outcomes">
                  <div className="space-y-4">
                    <AdminInput
                      label="Section Title"
                      value={keyOutcomesTitle}
                      onChange={setKeyOutcomesTitle}
                    />
                    <AdminTextarea
                      label="Section Description"
                      value={keyOutcomesDescription}
                      onChange={setKeyOutcomesDescription}
                      rows={3}
                    />
                    {keyOutcomesItems.map((outcome, idx) => (
                      <div
                        key={outcome.id}
                        className="p-4 border border-gray-300 rounded-lg space-y-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Outcome {idx + 1}</h4>
                          {keyOutcomesItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setKeyOutcomesItems(
                                  keyOutcomesItems.filter(
                                    (o) => o.id !== outcome.id
                                  )
                                )
                              }
                              className="text-red-600 text-sm hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Outcome Title (e.g., Build REST APIs)"
                          value={outcome.title}
                          onChange={(e) =>
                            setKeyOutcomesItems(
                              keyOutcomesItems.map((o) =>
                                o.id === outcome.id
                                  ? { ...o, title: e.target.value }
                                  : o
                              )
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <textarea
                          placeholder="Outcome Description"
                          value={outcome.description}
                          onChange={(e) =>
                            setKeyOutcomesItems(
                              keyOutcomesItems.map((o) =>
                                o.id === outcome.id
                                  ? { ...o, description: e.target.value }
                                  : o
                              )
                            )
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setKeyOutcomesItems([
                          ...keyOutcomesItems,
                          {
                            id: `outcome-${Date.now()}`,
                            title: "",
                            description: "",
                          },
                        ])
                      }
                      className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer"
                    >
                      + Add Outcome
                    </button>
                  </div>
                </AdminCard>

                {/* Meta Section */}
                <AdminCard title="SEO & Meta Information">
                  <div className="space-y-4">
                    <AdminInput
                      label="Meta Title"
                      value={metaTitle}
                      onChange={setMetaTitle}
                    />
                    <AdminTextarea
                      label="Meta Description"
                      value={metaDescription}
                      onChange={setMetaDescription}
                      rows={3}
                    />
                    <AdminInput
                      label="Meta Keywords (comma-separated)"
                      value={metaKeywords}
                      onChange={setMetaKeywords}
                    />
                  </div>
                </AdminCard>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-400 text-white rounded-lg cursor-pointer"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveStep2}
                    className="px-6 py-3 bg-green-700 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={savingStep2}
                  >
                    {(() => {
                      if (savingStep2) return "Saving...";
                      if (isEditMode) return "Update Course";
                      return "Finish & Save";
                    })()}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function AddNewCoursePage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="p-8 text-center text-gray-500">Loading...</div>
      </div>
    }>
      <AddNewCoursePageContent />
    </Suspense>
  );
}
