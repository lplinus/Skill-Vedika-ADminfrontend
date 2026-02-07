"use client";

import { useEffect, useState } from "react";
import { AdminInput, AdminTextarea, BannerBox,} from "../CorporateTraining/components/AdminUI";
import TipTapEditor from "../CorporateTraining/components/TipTapEditor";

import toast from "react-hot-toast";
import { api } from "@/utils/axios";

// Use an existing default image from public/default-uploads to avoid 404s
const DEFAULT_IMAGE = "/default-uploads/Skill-vedika-Logo.jpg";

export default function AboutPage() {
  const [heroHeading, setHeroHeading] = useState("");
  const [heroContent, setHeroContent] = useState("");
  const [heroBanner, setHeroBanner] = useState<string>(DEFAULT_IMAGE);

  const [demoHeading, setDemoHeading] = useState("");
  const [demoPoints, setDemoPoints] = useState<{ id: string; text: string }[]>([]);

  const [isSaving, setIsSaving] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("hero");

  // extract JSON parts
  const parseTitle = (input: string) => {
    const trimmed = input.trim();
  
    if (!trimmed) {
      return {
        text: "",
        part1: null,
        part2: null,
      };
    }
  
    // ✅ NO AUTO SPLIT
    // ✅ NO HTML
    return {
      text: trimmed,
      part1: trimmed,
      part2: null,
    };
  };
  


  // LOAD DATA
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/about-page");

        if (res.status != 200) {
          console.error("GET /about-page returned non-JSON response:", res.status);
          return;
        }
        
        const apiData = res.data?.data;
        if (!apiData) return;
  
        // HERO
        if (apiData.aboutus_title) {
          setHeroHeading(apiData.aboutus_title?.text ?? "");
        }        
  
        setHeroContent(apiData.aboutus_description ?? "");
  
        if (apiData.aboutus_image) {
          setHeroBanner(apiData.aboutus_image);
        }
  
        // DEMO
        if (apiData.demo_title) {
          setDemoHeading(apiData.demo_title?.text ?? "");
        }
  
        if (Array.isArray(apiData.demo_content)) {
          setDemoPoints(
            apiData.demo_content.map((item: any, index: number) => ({
              id: `demo-point-${index}`,
              text: item?.title ?? "",
            }))
          );
        } else {
          setDemoPoints([]);
        }
      } catch (err) {
        console.error("Load error:", err);
        toast.error("Network Error");
      }
    }
  
    load();
  }, []);
  

  // SAVE DATA
  const handleSubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const payload = {
      aboutus_title: parseTitle(heroHeading),
      aboutus_description: heroContent,
      aboutus_image: heroBanner,

      demo_title: parseTitle(demoHeading),
      demo_content: demoPoints
        .map((point) => ({ title: point.text?.trim() }))
        .filter((point) => point.title && point.title !== ''),
    };

    try {
      // Use correct backend endpoint: /api/about-page (not /api/about)
      const res = await api.post("/about-page", payload);
      if (res.status != 201) {
        console.error("POST /about-page returned non-JSON response:", res.status);
        toast.error("Save failed: " + (res.data.message || "Server error"));
        return;
      }
      toast.success("About Page Saved Successfully!");
    } catch (err) {
      console.error("POST /about-page failed:", err);
      toast.error("Network Error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold mb-6">About Page</h1>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-1 overflow-x-auto">
          {[
            { id: "hero", label: "Hero Section" },
            { id: "demo", label: "Live Free Demo" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors cursor-pointer ${activeTab === tab.id
                  ? "border-[#1A3F66] text-[#1A3F66]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {activeTab === "hero" && (
          <div className="p-6 space-y-4">
            <div>
              <AdminInput
                label="Heading"
                value={heroHeading}
                onChange={(val) => setHeroHeading(val)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: &quot;Text <span>Highlighted Text</span>&quot; (Text inside &lt;span&gt; tags will appear highlighted on the website)
              </p>
            </div>

            <TipTapEditor
              // label="Content"
              value={heroContent}
              onChange={setHeroContent}
            />

            <BannerBox
              label="Banner Image"
              image={heroBanner}
              onUpload={(url) => setHeroBanner(url)}
            />
          </div>
        )}

        {activeTab === "demo" && (
          <div className="p-6 space-y-4">
            <div>
              <AdminInput
                label="Demo Heading"
                value={demoHeading}
                onChange={setDemoHeading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: &quot;Text <span>Highlighted Text</span>&qout; (Text inside &lt;span&gt; tags will appear highlighted on the website)
              </p>
            </div>

            <div className="space-y-4 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Demo Points (Bullet Points):</p>
                <button
                  type="button"
                  onClick={() => {
                    setDemoPoints([
                      ...demoPoints,
                      {
                        id: `demo-point-${Date.now()}-${Math.random()}`,
                        text: "",
                      },
                    ]);
                  }}
                  className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  + Add Point
                </button>
              </div>

              {demoPoints.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-4 text-center border border-dashed border-gray-300 rounded-lg">
                  No demo points added yet. Click &quot;Add Point&quot; to add one.
                </p>
              ) : (
                demoPoints.map((point, index) => (
                  <div
                    key={point.id || `demo-point-${index}`}
                    className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-gray-600 font-semibold">
                        Demo Point {index + 1}*
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newPoints = demoPoints.filter((_, i) => i !== index);
                          setDemoPoints(newPoints);
                        }}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <AdminInput
                      label=""
                      value={point.text}
                      onChange={(value) => {
                        const newPoints = [...demoPoints];
                        newPoints[index] = { ...newPoints[index], text: value };
                        setDemoPoints(newPoints);
                      }}
                    />
                  </div>
                ))
              )}

              <p className="text-xs text-gray-500 mt-1">
                Each point will appear as a bullet point on the website
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Submit"}
        </button>
      </div>

    </div>
  );
}
