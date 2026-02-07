"use client";

import { useEffect, useState } from "react";
import { api } from "@/utils/axios";
import { isAxiosError } from "axios";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import TipTapEditor from "@/app/dashboard/AllPages/CorporateTraining/components/TipTapEditor";
import { AdminCard, AdminInput } from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  show: boolean;
}

export default function EditFaqPage() {
  const router = useRouter();
  const { id } = useParams();

  const [faq, setFaq] = useState<FAQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadFaq() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.get(`/faqs/${id}`);
        setFaq(res.data);
      } catch (error) {
        console.error("Failed to load FAQ:", error);
        toast.error("Failed to load FAQ");
      } finally {
        setLoading(false);
      }
    }
    void loadFaq();
  }, [id]);

  const saveFaq = async () => {
    if (!faq) return;
    if (!faq.question.trim()) {
      toast.error("Question is required");
      return;
    }

    setSaving(true);

    try {
      await api.put(`/faqs/${id}`, faq);
      toast.success("FAQ updated successfully!");
      router.push("/dashboard/CourseManagement/CourseFAQs");
    } catch (error) {
      console.error("Failed to update FAQ:", error);
      let errorMessage = "Failed to update FAQ";
      try {
        if (isAxiosError(error)) {
          const resp = error.response;
          const respData = (resp && resp.data) as
            | { message?: string; error?: string; errors?: Record<string, string[]> }
            | undefined;
          if (resp?.status === 401) {
            errorMessage = "Unauthenticated. Please login to edit FAQs.";
          } else if (resp?.status === 422 && respData?.errors) {
            const errors = Object.values(respData.errors).flat();
            errorMessage = errors.join(" ");
          } else {
            errorMessage =
              respData?.message || respData?.error || (error as Error).message || errorMessage;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message || errorMessage;
        }
      } catch {
        // fallback
      }
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center">
        <div className="text-gray-600">Loading FAQ data...</div>
      </div>
    );
  }

  if (!faq) {
    return (
      <div className="p-10 flex items-center justify-center">
        <div className="text-gray-600">FAQ not found</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Edit FAQ</h1>

      <AdminCard title="FAQ Details">
        <AdminInput
          label="Question"
          value={faq.question}
          onChange={(val: string) => setFaq({ ...faq, question: val })}
        />

        <div className="mt-4">
          <label className="font-semibold text-gray-600 mb-1 block">
            Answer
          </label>
          <TipTapEditor
            value={faq.answer}
            onChange={(val: string) => setFaq({ ...faq, answer: val })}
          />
        </div>

        <div className="mt-4">
          <label className="font-semibold text-gray-600 mb-1 block">
            Show FAQ?
          </label>
          <select
            value={faq.show ? "1" : "0"}
            onChange={(e) => setFaq({ ...faq, show: e.target.value === "1" })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring focus:ring-blue-200 outline-none"
          >
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>
      </AdminCard>

      <div className="flex gap-4">
        <button
          onClick={saveFaq}
          disabled={saving}
          className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg shadow-sm transition disabled:bg-gray-400 font-semibold"
        >
          {saving ? "Saving..." : "Update FAQ"}
        </button>
        <button
          onClick={() => router.push("/dashboard/CourseManagement/CourseFAQs")}
          className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-lg shadow-sm transition font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
