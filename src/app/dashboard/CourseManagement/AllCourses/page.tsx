"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash } from "react-icons/fa";
import { api } from "@/utils/axios";
import toast from "react-hot-toast";

interface Course {
  id: number;
  title: string;
  description?: string;
  image?: string;
  price?: number;
  rating?: number;
  students: number;
  category_id?: number;
  status?: string;
  mode?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const router = useRouter();

  // Fetch courses on mount
  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);

        const res = await api.get("/courses", {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        setCourses(data);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  // Format date helper
  function formatDate(dateStr: string) {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + " | " + d.toLocaleTimeString();
    } catch {
      return dateStr;
    }
  }

  // Resolve image URL: if full URL return as-is, otherwise prepend backend origin
  function resolveImageUrl(img?: string | null) {
    const fallback = "/default-uploads/default-course.png";
    if (!img) return fallback;
    if (/^https?:\/\//i.test(img)) return img;
    // If the image path does not start with '/', prepend '/storage/'
    const path = img.startsWith("/") ? img : `/storage/${img}`;
    // derive backend origin from axios baseURL
    const base = (api.defaults.baseURL || "").replace(/\/?api\/?$/i, "");
    const url = base + path;
    console.log("[AllCourses] course.image=", img, "resolved=", url);
    return url;
  }

  // Delete course
  async function handleDelete(courseId: number) {
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses(courses.filter((c) => c.id !== courseId));
      setDeleteConfirm(null);
      toast.success("Course deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete course");
    }
  }

  const filteredCourses = courses.filter((c) =>
    (c.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="p-8 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-lg border border-gray-200">
          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">All Courses</h1>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/CourseManagement/AddNewCourse')}
                className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-3 rounded-xl shadow transition"
              >
                Add new Course
              </button>

              <input
                type="text"
                placeholder="Search Course..."
                className="border border-gray-300 rounded-xl px-4 py-3 w-64 text-gray-700 focus:ring focus:ring-blue-200 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* WRAPPER WITH ROUNDED CORNERS LIKE YOUR IMAGE */}
          <div className="overflow-x-auto rounded-3xl border border-gray-200 shadow-sm backdrop-blur-xl bg-white/80">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading courses...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No courses found</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-100/60 backdrop-blur-xl border-b border-gray-200">
                  <tr>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 border-b">Banner</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 border-b">ID</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 border-b">Course Name</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 border-b">Student Enroll</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 border-b">Status</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 border-b">Mode</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 border-b">Created Date</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 border-b">Last Updated</th>
                    <th className="py-4 px-6 text-sm font-semibold text-gray-700 border-b">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-5">
                        <div className="h-12 w-20 relative">
                          <Image
                            src={resolveImageUrl(course.image)}
                            alt={course.title || "Course banner"}
                            fill
                            className="object-cover rounded-md"
                            unoptimized
                          />
                        </div>
                      </td>
                      <td className="py-4 px-5 font-semibold text-gray-900">
                        {course.id}
                      </td>
                      <td className="py-4 px-5">{course.title || "N/A"}</td>
                      <td className="py-4 px-5">{course.students || 0}</td>

                      <td className="py-4 px-5">
                        <span
                          className={`px-4 py-1 rounded-full text-sm font-medium ${course.status === "popular"
                            ? "bg-blue-100 text-blue-700"
                            : course.status === "trending"
                              ? "bg-purple-100 text-purple-700"
                              : course.status === "free"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {course.status ?? "None"}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`px-4 py-1 rounded-full text-sm font-medium ${course.mode === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                            }`}
                        >
                          {course.mode === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="py-4 px-5">{course.created_at ? formatDate(course.created_at) : "N/A"}</td>
                      <td className="py-4 px-5">{course.updated_at ? formatDate(course.updated_at) : "N/A"}</td>

                      <td className="py-4 px-5 flex items-center gap-3">
                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => router.push(`/dashboard/CourseManagement/AddNewCourse?courseId=${course.id}`)}
                          className="text-yellow-600 bg-[#FFF6C4] p-2 rounded-xl shadow-sm hover:bg-[#FFEF9E] transition flex items-center justify-center cursor-pointer"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => setDeleteConfirm(course.id)}
                          className="text-red-600 bg-[#FFE3E3] p-2 rounded-xl shadow-sm hover:bg-[#FFCCCC] transition flex items-center justify-center cursor-pointer"
                          title="Delete"
                        >
                          <FaTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* DELETE CONFIRMATION MODAL */}
          {deleteConfirm !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Course?</h2>
                <p className="text-gray-600 mb-6">Are you sure you want to delete this course? This action cannot be undone.</p>
                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
