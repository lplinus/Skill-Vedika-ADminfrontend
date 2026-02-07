"use client";

import { useEffect, useState } from "react";
import {
  AdminInput,
  AdminTextarea,
} from "../CorporateTraining/components/AdminUI";
import toast from "react-hot-toast";
import { api } from "@/utils/axios";

export default function InterviewQuestionsPage() {
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pageId, setPageId] = useState<number | null>(null);

  // LOAD DATA
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/interview-questions-page");

        if (res.status !== 200) {
          console.error("GET /interview-questions-page returned non-200 response:", res.status);
          return;
        }

        const apiData = res.data?.data;
        if (!apiData || Object.keys(apiData).length === 0) {
          // No data exists yet, use defaults
          setHeroTitle("Interview Questions by Skill");
          setHeroDescription(
            "Prepare for your next technical interview with comprehensive questions and answers across top programming languages, frameworks, and technologies."
          );
          return;
        }

        setPageId(apiData.id);
        setHeroTitle(apiData.hero_title || "Interview Questions by Skill");
        setHeroDescription(
          apiData.hero_description ||
            "Prepare for your next technical interview with comprehensive questions and answers across top programming languages, frameworks, and technologies."
        );
      } catch (err) {
        console.error("Load error:", err);
        toast.error("Failed to load page content");
      }
    }

    load();
  }, []);

  // SAVE DATA
  const handleSubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const payload = {
      hero_title: heroTitle,
      hero_description: heroDescription,
    };

    try {
      let res;
      if (pageId) {
        // Update existing
        res = await api.put(`/interview-questions-page/${pageId}`, payload);
      } else {
        // Create new
        res = await api.post("/interview-questions-page", payload);
        if (res.status === 201 && res.data?.data?.id) {
          setPageId(res.data.data.id);
        }
      }

      if (res.status === 200 || res.status === 201) {
        toast.success("Interview Questions Page Saved Successfully!");
      } else {
        toast.error("Save failed: " + (res.data?.message || "Server error"));
      }
    } catch (err: any) {
      console.error("Save error:", err);
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to save";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Interview Questions Page</h1>

      {/* Hero Section */}
      <div className="bg-gray-50 p-6 rounded-xl space-y-5 shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700">Hero Section</h2>

        <AdminInput
          label="Hero Title"
          value={heroTitle}
          onChange={(val) => setHeroTitle(val)}
          required
        />

        <AdminTextarea
          label="Hero Description"
          value={heroDescription}
          onChange={(val) => setHeroDescription(val)}
          rows={4}
        />
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            isSaving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#1A3F66] hover:bg-blue-800 text-white"
          }`}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

