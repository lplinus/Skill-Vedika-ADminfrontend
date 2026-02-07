"use client";

import { useState } from "react";
import { api } from "@/utils/axios";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import TipTapEditor from "@/app/dashboard/AllPages/CorporateTraining/components/TipTapEditor";
import { AdminCard, AdminInput } from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";
import { useRouter } from "next/navigation";

export default function NewFaqPage() {
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [show, setShow] = useState(true);
  const [saving, setSaving] = useState(false);

  const saveFaq = async () => {
    if (!question.trim()) {
      toast.error("Question is required");
      return;
    }

    setSaving(true);

    try {
      await api.post("/faqs", {
        question,
        answer,
        show,
      });

      toast.success("FAQ created successfully!");
      router.push("/dashboard/CourseManagement/CourseFAQs");
    } catch (error) {
      console.error("Failed to save FAQ:", error);
      let errorMessage = "Failed to save FAQ";
      try {
        if (isAxiosError(error)) {
          const resp = error.response;
          const respData = (resp && resp.data) as
            | { message?: string; error?: string; errors?: Record<string, string[]> }
            | undefined;
          if (resp?.status === 401) {
            errorMessage = "Unauthenticated. Please login to create FAQs.";
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

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Add New FAQ</h1>

      <AdminCard title="FAQ Details">
        <AdminInput
          label="Question"
          value={question}
          onChange={setQuestion}
        />

        <div className="mt-4">
          <label className="font-semibold text-gray-600 mb-1 block">
            Answer
          </label>
          <TipTapEditor value={answer} onChange={setAnswer} />
        </div>

        <div className="mt-4">
          <label className="font-semibold text-gray-600 mb-1 block">
            Show FAQ?
          </label>
          <select
            value={show ? "1" : "0"}
            onChange={(e) => setShow(e.target.value === "1")}
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
          {saving ? "Saving..." : "Save FAQ"}
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
