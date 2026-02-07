"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { FaEdit, FaTrash } from "react-icons/fa";
import { AdminCard, AdminInput, AdminTextarea } from "../CorporateTraining/components/AdminUI";
import { api } from "@/utils/axios";

export default function CourseListingPage() {
  const [isSaving, setIsSaving] = useState(false);

  const [heading, setHeading] = useState("");
  const [subHeading, setSubHeading] = useState("");
  const [categoryHeading, setCategoryHeading] = useState("");
  const [testimonialsHeading, setTestimonialsHeading] = useState("");
  const [testimonialsSubheading, setTestimonialsSubheading] = useState("");

  // Testimonials Management State
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(false);
  const [testimonialsSearch, setTestimonialsSearch] = useState("");
  const [openTestimonialModal, setOpenTestimonialModal] = useState(false);
  const [selectedTestimonialId, setSelectedTestimonialId] = useState<number | null>(null);
  const [isCreatingTestimonial, setIsCreatingTestimonial] = useState(false);

  // Testimonial Form Fields
  const [studentName, setStudentName] = useState("");
  const [studentRole, setStudentRole] = useState("");
  const [studentCompany, setStudentCompany] = useState("");
  const [courseCategory, setCourseCategory] = useState("");
  const [rating, setRating] = useState(5);
  const [testimonialText, setTestimonialText] = useState("");
  const [studentImage, setStudentImage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);

  /* ===================== FETCH EXISTING DATA ===================== */
  useEffect(() => {
    (async () => {
      
      try {
        const res = await api.get(
          `/course-page-content`,
        );

        if (res.status !== 200) {
          toast.error(`Failed to load course content: ${res.status}`);
          return;
        }
        const data = res.data;
        setHeading(data.heading || "");
        setSubHeading(data.subheading || "");
        setCategoryHeading(data.sidebar_heading || "");
        setTestimonialsHeading(data.testimonials_heading || "");
        setTestimonialsSubheading(data.testimonials_subheading || "");
      } catch (err) {
        console.error("Network error while fetching course content", err);
        toast.error("Network error: Failed to fetch course content");
      }
    })();
  }, []);

  /* ===================== FETCH TESTIMONIALS ===================== */
  const fetchTestimonials = useCallback(async () => {
    setTestimonialsLoading(true);
    try {
      const res = await api.get("/admin/testimonials", {
        headers: { "Cache-Control": "no-cache" },
      });
      
      if (res.status === 200) {
        const data = res.data?.data || res.data || [];
        setTestimonials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch testimonials:", err);
      toast.error("Failed to load testimonials");
    } finally {
      setTestimonialsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  /* ===================== SAVE DATA ===================== */
  async function saveData() {
    setIsSaving(true);
    console.log("=== Course Listing Save Started ===");

    // Client-side validation: ensure required fields are present
    const trimmedHeading = heading.trim();
    const trimmedSubHeading = subHeading.trim();
    const trimmedCategoryHeading = categoryHeading.trim();

    if (!trimmedHeading || !trimmedSubHeading || !trimmedCategoryHeading) {
      toast.error("Please fill all required fields before submitting.");
      setIsSaving(false);
      return;
    }

    const payload = {
      heading: trimmedHeading,
      subheading: trimmedSubHeading,
      sidebar_heading: trimmedCategoryHeading,
      testimonials_heading: testimonialsHeading.trim(),
      testimonials_subheading: testimonialsSubheading.trim(),
    };

    console.log("Payload:", payload);

    try {
      console.log(
        "process.env.NEXT_PUBLIC_API_URL",
        process.env.NEXT_PUBLIC_API_URL
      );
      const url = `/course-page-content`;
      console.log("Fetching:", url);
      const res = await api.put(url, payload);

      console.log("Response status:", res.status, "ok:", res.status === 200);

      let result: Record<string, unknown> | null = null;
      try {
        result = res.data;
        console.log("Response JSON:", result);
      } catch (e) {
        console.debug("Non-JSON response", e);
        result = { message: `HTTP ${res.status}` };
      }

      if (res.status === 200) {
        console.log("Success! Updating UI...");
        toast.success("Course Page Updated Successfully!");
      } else {
        // Try to show a useful error from validation or message
        let message = "Failed to update";
        if (result && typeof result === "object") {
          const r = result as Record<string, unknown>;
          if (Object.prototype.hasOwnProperty.call(r, "errors")) {
            const errs = r["errors"];
            if (errs && typeof errs === "object") {
              const errObj = errs as Record<string, unknown>;
              const firstKey = Object.keys(errObj)[0];
              const firstVal = firstKey ? errObj[firstKey] : undefined;
              if (Array.isArray(firstVal) && firstVal.length > 0) {
                const firstMsg = firstVal[0];
                if (typeof firstMsg === "string") message = firstMsg;
              }
            }
          } else if (Object.prototype.hasOwnProperty.call(r, "message")) {
            const m = r["message"];
            if (typeof m === "string") message = m;
          }
        }
        console.error("Server error:", message);
        toast.error(message || "Failed to update");
      }
    } catch (err) {
      console.error("=== FETCH ERROR ===", err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as unknown as { message?: string }).message
          : String(err);
      toast.error(msg || "Network error: Failed to fetch");
    } finally {
      setIsSaving(false);
    }
  }

  /* ===================== TESTIMONIALS MANAGEMENT ===================== */
  const openCreateTestimonialModal = () => {
    setIsCreatingTestimonial(true);
    setSelectedTestimonialId(null);
    setStudentName("");
    setStudentRole("");
    setStudentCompany("");
    setCourseCategory("");
    setRating(5);
    setTestimonialText("");
    setStudentImage("");
    setIsActive(true);
    setDisplayOrder(0);
    setOpenTestimonialModal(true);
  };

  const openEditTestimonialModal = (testimonial: any) => {
    setIsCreatingTestimonial(false);
    setSelectedTestimonialId(testimonial.id);
    setStudentName(testimonial.student_name || "");
    setStudentRole(testimonial.student_role || "");
    setStudentCompany(testimonial.student_company || "");
    setCourseCategory(testimonial.course_category || "");
    setRating(testimonial.rating || 5);
    setTestimonialText(testimonial.testimonial_text || "");
    setStudentImage(testimonial.student_image || "");
    setIsActive(testimonial.is_active ?? true);
    setDisplayOrder(testimonial.display_order ?? 0);
    setOpenTestimonialModal(true);
  };

  const handleSaveTestimonial = async () => {
    if (!studentName.trim() || !courseCategory.trim() || !testimonialText.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload: any = {
      student_name: studentName.trim(),
      student_role: studentRole.trim() || null,
      student_company: studentCompany.trim() || null,
      course_category: courseCategory.trim(),
      rating: Number(rating) || 5,
      testimonial_text: testimonialText.trim(),
      student_image: studentImage.trim() || null,
      is_active: Boolean(isActive),
      display_order: Number(displayOrder) || 0,
    };

    try {
      if (isCreatingTestimonial) {
        const res = await api.post("/admin/testimonials", payload);
        if (res.status === 201) {
          toast.success("Testimonial created successfully");
          setOpenTestimonialModal(false);
          await fetchTestimonials();
        }
      } else if (selectedTestimonialId) {
        const res = await api.put(`/admin/testimonials/${selectedTestimonialId}`, payload);
        if (res.status === 200) {
          toast.success("Testimonial updated successfully");
          setOpenTestimonialModal(false);
          await fetchTestimonials();
        }
      }
    } catch (err: any) {
      console.error("Failed to save testimonial:", err);
      const errorMessage = err?.response?.data?.message || err?.response?.data?.errors || "Failed to save testimonial";
      if (typeof errorMessage === "object" && errorMessage !== null) {
        const firstError = Object.values(errorMessage)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        toast.error(String(errorMessage));
      }
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) {
      return;
    }

    try {
      const res = await api.delete(`/admin/testimonials/${id}`);
      if (res.status === 200) {
        toast.success("Testimonial deleted successfully");
        await fetchTestimonials();
      }
    } catch (err) {
      console.error("Failed to delete testimonial:", err);
      toast.error("Failed to delete testimonial");
    }
  };

  const filteredTestimonials = testimonials.filter((t) =>
    t.student_name?.toLowerCase().includes(testimonialsSearch.toLowerCase()) ||
    t.course_category?.toLowerCase().includes(testimonialsSearch.toLowerCase()) ||
    t.testimonial_text?.toLowerCase().includes(testimonialsSearch.toLowerCase())
  );

  /* ===================== UI ===================== */
  return (
    <section
      className="bg-white p-6 rounded-2xl shadow-sm"
      style={{ border: "1px solid rgba(16,24,40,0.08)" }}
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Course Listing Page
      </h1>

      <div className="space-y-6">
        <AdminCard title="Course Listing Hero Section">
          <AdminInput label="Heading*" value={heading} onChange={setHeading} />

          <AdminInput
            label="Sub Heading*"
            value={subHeading}
            onChange={setSubHeading}
          />

          <AdminInput
            label="Sidebar Heading*"
            value={categoryHeading}
            onChange={setCategoryHeading}
          />
        </AdminCard>

        <AdminCard title="Testimonials Section Headings">
          <AdminInput
            label="Testimonials Heading"
            value={testimonialsHeading}
            onChange={setTestimonialsHeading}
          />

          <AdminTextarea
            label="Testimonials Subheading"
            value={testimonialsSubheading}
            onChange={setTestimonialsSubheading}
            rows={3}
          />
        </AdminCard>

        <div className="flex justify-end">
          <button
            onClick={saveData}
            className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            {isSaving ? "Saving..." : "Submit"}
          </button>
        </div>

        {/* Testimonials Management Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Course Listing Testimonials</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={openCreateTestimonialModal}
                className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
              >
                Add New Testimonial
              </button>
              <input
                type="text"
                placeholder="Search testimonials..."
                className="px-4 py-2 border border-gray-300 rounded-xl shadow-sm w-64 focus:ring focus:ring-blue-200 outline-none"
                value={testimonialsSearch}
                onChange={(e) => setTestimonialsSearch(e.target.value)}
              />
            </div>
          </div>

          {testimonialsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading testimonials...</div>
          ) : filteredTestimonials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No testimonials found</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role/Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Display Order</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTestimonials.map((testimonial) => (
                    <tr key={testimonial.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{testimonial.student_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {testimonial.student_role}
                        {testimonial.student_company && ` at ${testimonial.student_company}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{testimonial.course_category}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-lg ${
                                star <= (testimonial.rating || 0)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ml-1 text-gray-600 text-xs">({testimonial.rating || 0})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{testimonial.display_order ?? 0}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            testimonial.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {testimonial.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditTestimonialModal(testimonial)}
                            className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition cursor-pointer"
                            title="Edit"
                            aria-label="Edit testimonial"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTestimonial(testimonial.id)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition cursor-pointer"
                            title="Delete"
                            aria-label="Delete testimonial"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Testimonial Modal */}
        {openTestimonialModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                {isCreatingTestimonial ? "Add New Testimonial" : "Edit Testimonial"}
              </h3>

              <div className="space-y-4">
                <AdminInput
                  label="Student Name*"
                  value={studentName}
                  onChange={setStudentName}
                  required
                />
                <AdminInput
                  label="Student Role"
                  value={studentRole}
                  onChange={setStudentRole}
                />
                <AdminInput
                  label="Student Company"
                  value={studentCompany}
                  onChange={setStudentCompany}
                />
                <AdminInput
                  label="Course Category*"
                  value={courseCategory}
                  onChange={setCourseCategory}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rating-input" className="text-gray-600 font-semibold mb-2 block">
                      Rating* (1-5)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-2xl transition ${
                              star <= rating
                                ? "text-yellow-400"
                                : "text-gray-300 hover:text-yellow-200"
                            }`}
                            aria-label={`Rate ${star} stars`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="ml-2 text-gray-600 font-medium">({rating}/5)</span>
                      </div>
                      <input
                        id="rating-input"
                        type="number"
                        min="1"
                        max="5"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value) || 5)}
                        className="w-20 px-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="display-order-input" className="text-gray-600 font-semibold mb-2 block">
                      Display Order
                    </label>
                    <input
                      id="display-order-input"
                      type="number"
                      min="0"
                      value={(displayOrder ?? 0).toString()}
                      onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition"
                    />
                  </div>
                </div>
                <AdminTextarea
                  label="Testimonial Text*"
                  value={testimonialText}
                  onChange={setTestimonialText}
                  rows={4}
                  required
                />
                <AdminInput
                  label="Student Image (Cloudinary Public ID)"
                  value={studentImage}
                  onChange={setStudentImage}
                />
                <div>
                  <label htmlFor="is-active-checkbox" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="is-active-checkbox"
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-600 font-semibold">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setOpenTestimonialModal(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTestimonial}
                  className="px-6 py-2.5 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-xl shadow-sm transition cursor-pointer"
                >
                  {isCreatingTestimonial ? "Create" : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
