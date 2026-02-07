"use client";

import { useEffect, useState, useCallback } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { api } from "@/utils/axios";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  show: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export default function FAQListPage() {
  const router = useRouter();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Load FAQs from backend
  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/faqs");
      setFaqs(res.data.faqs || []);
    } catch (err) {
      console.error("Failed to load FAQs:", err);
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFaqs();
  }, [fetchFaqs]);

  const filtered = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.id.toString().includes(search)
  );

  // Strip HTML tags from TipTap/HTML answers for safe preview in the table
  function stripHtml(html: string) {
    if (!html) return "";
    try {
      return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    } catch {
      return html;
    }
  }

  const handleDeleteConfirm = async () => {
    if (showDeleteConfirm === null) return;

    try {
      setDeletingId(showDeleteConfirm);
      await api.delete(`/faqs/${showDeleteConfirm}`);
      toast.success("FAQ deleted successfully!");
      setFaqs(faqs.filter((f) => f.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete FAQ:", error);
      let errorMessage = "Failed to delete FAQ";
      if (isAxiosError(error)) {
        const respData = error.response?.data as
          | { message?: string; error?: string }
          | undefined;
        errorMessage = respData?.message || respData?.error || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 bg-white rounded-3xl shadow-md border border-gray-200">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All FAQs</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              router.push("/dashboard/CourseManagement/CourseFAQs/manage/new")
            }
            className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl shadow-sm transition"
          >
            Add New FAQ
          </button>

          <input
            placeholder="Search FAQs..."
            className="px-6 py-3 border border-gray-300 rounded-xl shadow-sm w-72 focus:ring focus:ring-blue-200 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-3xl border border-gray-200 shadow-sm backdrop-blur-xl bg-white/80">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100/60 border-b border-gray-200">
              <th className="py-4 px-6 font-semibold text-gray-700">ID</th>
              <th className="py-4 px-6 font-semibold text-gray-700">Question</th>
              <th className="py-4 px-6 font-semibold text-gray-700">Answer</th>
              <th className="py-4 px-6 font-semibold text-gray-700">Show?</th>
              <th className="py-4 px-6 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  Loading FAQs...
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  {search ? "No FAQs found." : "No FAQs yet."}
                </td>
              </tr>
            )}

            {filtered.map((faq) => (
              <tr key={faq.id} className="border-b border-gray-200">
                <td className="py-4 px-6">{faq.id}</td>
                <td className="py-4 px-6 text-gray-800">
                  {faq.question.length > 70
                    ? faq.question.substring(0, 70) + "..."
                    : faq.question}
                </td>

                <td className="py-4 px-6 text-gray-700">
                  {stripHtml(faq.answer || "").length > 120
                    ? stripHtml(faq.answer || "").substring(0, 120) + "..."
                    : stripHtml(faq.answer || "")}
                </td>

                <td className="py-4 px-6">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm ${
                      faq.show
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {faq.show ? "Yes" : "No"}
                  </span>
                </td>

                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    {/* EDIT */}
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/CourseManagement/CourseFAQs/manage/${faq.id}`
                        )
                      }
                      className="text-yellow-600 bg-[#FFF6C4] p-2 rounded-xl shadow-sm hover:bg-[#FFEF9E] transition"
                      title="Edit FAQ"
                    >
                      <FaEdit size={18} />
                    </button>

                    {/* DELETE */}
                    <button
                      onClick={() => setShowDeleteConfirm(faq.id)}
                      className="text-red-600 bg-[#FFE3E3] p-2 rounded-xl shadow-sm hover:bg-[#FFCCCC] transition"
                      title="Delete FAQ"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Confirm Delete
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this FAQ? This action cannot be
              undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
              >
                {deletingId !== null ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
