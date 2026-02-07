"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import TipTapEditor from "../CorporateTraining/components/TipTapEditor";
import { AdminCard, AdminInput } from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";
import { api } from "@/utils/axios";

type DocumentType = "student" | "instructor" | "privacy";

const DOCUMENT_CONFIG: Record<
  DocumentType,
  { label: string; defaultTitle: string }
> = {
  student: {
    label: "Student Terms & Conditions",
    defaultTitle: "Student Terms & Conditions",
  },
  instructor: {
    label: "Instructor Terms & Conditions",
    defaultTitle: "Instructor Terms & Conditions",
  },
  privacy: {
    label: "Privacy Policy",
    defaultTitle: "Privacy Policy",
  },
};

export default function LegalDocumentsPage() {
  const [activeTab, setActiveTab] = useState<DocumentType>("student");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  /* --------------------------------
     LOAD DATA WHEN TAB CHANGES
  -------------------------------- */
  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      setTitle("");
      setContent("");

      try {
        const res = await api.get(`/legal/${activeTab}`);

        if (res.status !== 200) {
          toast.error(`Failed to load ${DOCUMENT_CONFIG[activeTab].label}`);
          return;
        }

        const record = res.data?.data;
        if (record) {
          setTitle(typeof record.title === "string" ? record.title : "");
          setContent(typeof record.content === "string" ? record.content : "");
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab}:`, err);
        toast.error(`Network error while loading ${DOCUMENT_CONFIG[activeTab].label}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [activeTab]);

  /* --------------------------------
     SAVE HANDLER (Single logic for all tabs)
  -------------------------------- */
  const handleSubmit = async () => {
    if (isSaving) return;

    // Frontend validation - check if content has actual text (not just empty HTML)
    const hasContent = content && content.trim() !== "" && content.trim() !== "<p></p>" && content.trim() !== "<p><br></p>";
    if (!hasContent) {
      toast.error("Content is required. Please add some content before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: title || DOCUMENT_CONFIG[activeTab].defaultTitle,
        type: activeTab,
        content: content,
      };

      const res = await api.post("/legal", payload);

      if (res.status !== 201) {
        toast.error("Save failed");
        return;
      }

      const record = res.data?.data;
      if (record) {
        setTitle(typeof record.title === "string" ? record.title : "");
        setContent(typeof record.content === "string" ? record.content : "");
      }

      toast.success(`${DOCUMENT_CONFIG[activeTab].label} saved successfully!`);
    } catch (err: any) {
      console.error("Save error:", err);
      
      // Handle validation errors from backend
      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors || err.response?.data?.message;
        if (errors) {
          if (typeof errors === "string") {
            toast.error(errors);
          } else if (typeof errors === "object") {
            const errorMessages = Object.values(errors).flat().join(", ");
            toast.error(`Validation error: ${errorMessages}`);
          } else {
            toast.error("Validation error. Please check all fields.");
          }
        } else {
          toast.error("Validation error. Please check all fields.");
        }
      } else {
        toast.error("Network error while saving");
      }
    } finally {
      setIsSaving(false);
    }
  };

  /* --------------------------------
     RENDER
  -------------------------------- */
  return (
    <main className="mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-10 border border-gray-100">
        <h1 className="text-3xl font-semibold">Legal Documents</h1>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-1 overflow-x-auto">
            {(["student", "instructor", "privacy"] as DocumentType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "border-[#1A3F66] text-[#1A3F66]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {DOCUMENT_CONFIG[tab].label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Single Editor */}
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading {DOCUMENT_CONFIG[activeTab].label}...</p>
          </div>
        ) : (
          <>
            <AdminCard title={`${DOCUMENT_CONFIG[activeTab].label} Editor`}>
              <AdminInput
                label="Page Title"
                value={title}
                onChange={setTitle}
              />

              <div className="space-y-2">
                <label htmlFor="content-editor" className="text-gray-600 font-semibold">
                  Content
                </label>
                <div id="content-editor">
                  <TipTapEditor value={content} onChange={setContent} />
                </div>
              </div>
            </AdminCard>

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSaving ? "Saving..." : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

