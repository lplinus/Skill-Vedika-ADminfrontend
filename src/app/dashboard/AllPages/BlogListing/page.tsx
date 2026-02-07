"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AdminInput,
  AdminTextarea,
  BannerBox,
} from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";
import { api } from "@/utils/axios";

export default function BlogListingPage() {
  const [isSaving, setIsSaving] = useState(false);

  const [heroHeading, setHeroHeading] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [categoryHeading, setCategoryHeading] = useState("");
  const [bannerImage, setBannerImage] = useState("");

  const [demoHeading, setDemoHeading] = useState("");
  const [demoSubContent, setDemoSubContent] = useState("");
  const [demoPoints, setDemoPoints] = useState<{ id: string; title: string }[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("hero");

  // Load saved data on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/blog-page");
        if (res.status !== 200) {
          console.warn("Could not fetch saved blog-page settings", res.status);
          return;
        }
        const data = res.data.data;
        let response: unknown = null;
        try {
          response = data;
        } catch {
          return;
        }
        const dataObj = data as Record<string, unknown>;
        const heroTitle =
          dataObj.hero_title && typeof dataObj.hero_title === "object"
            ? (dataObj.hero_title as Record<string, unknown>)
            : null;
        const demoTitle =
          dataObj.demo_title && typeof dataObj.demo_title === "object"
            ? (dataObj.demo_title as Record<string, unknown>)
            : null;

        // Helper: Extract title from object or string (handles part1/part2 format)
        const extractTitle = (title: unknown, fallback: string): string => {
          if (!title) return fallback;
          if (typeof title === "string") return title;
          const titleObj = title as {
            text?: string;
            part1?: string;
            part2?: string;
          };
          // If part1 and part2 exist, combine them with a space; otherwise use text
          if (titleObj.part1 && titleObj.part2) {
            return `${titleObj.part1} ${titleObj.part2}`;
          }
          // If only part1 exists, use it
          if (titleObj.part1) {
            return titleObj.part1;
          }
          // Fall back to text
          return titleObj.text ?? fallback;
        };

        // Map backend fields to state
        setHeroHeading(extractTitle(heroTitle, ""));
        setHeroDescription(String(dataObj.hero_description ?? ""));
        setCategoryHeading(String(dataObj.sidebar_name ?? ""));
        setBannerImage(String(dataObj.hero_image ?? ""));
        setDemoHeading(extractTitle(demoTitle, ""));
        setDemoSubContent(String(dataObj.demo_subtitle ?? ""));

        // Handle demo_points as array of strings - load into dynamic array
        const pointsArray = Array.isArray(dataObj.demo_points)
          ? dataObj.demo_points
          : [];

          setDemoPoints(
            pointsArray.map((point: any, index: number) => ({
              id: `demo-point-${index}-${Date.now()}`,
              title:
                typeof point === "object" && point !== null
                  ? String(point.title ?? "")
                  : "",
            }))
          );          

      } catch (err: unknown) {
        console.error("Failed to load blog-page settings:", err);
      }
    }

    load();
  }, []);

  const handleSubmit = async () => {
    setIsSaving(true);

    // Helper: Parse title into {text, part1, part2} format
    // The website frontend Hero component checks for part1/part2 first, then falls back to text
    // We'll try to intelligently split the input if it looks like it has two parts
    const parseTitle = (
      input: string
    ): { text: string; part1: string | null; part2: string | null } => {
      if (!input || !input.trim()) {
        return { text: "", part1: null, part2: null };
      }
    
      const trimmed = input.trim();
    
      // If admin explicitly typed <span> (power users)
      const spanMatch = trimmed.match(/<span>(.*?)<\/span>/i);
    
      if (spanMatch) {
        const part2 = spanMatch[1].trim();
        const part1 = trimmed.replace(/<span>.*?<\/span>/i, "").trim();
    
        return {
          text: `${part1} ${part2}`.trim(),
          part1,
          part2,
        };
      }
    
      // Normal admin input → auto split last 2 words
      const words = trimmed.split(/\s+/);
    
      if (words.length >= 3) {
        const part1 = words.slice(0, -2).join(" ");
        const part2 = words.slice(-2).join(" ");
    
        return {
          text: trimmed,
          part1,
          part2,
        };
      }
    
      // Short titles → no highlight
      return {
        text: trimmed,
        part1: trimmed,
        part2: null,
      };
    };
      

    const heroTitlePayload = parseTitle(heroHeading ?? "");
    const demoTitlePayload = parseTitle(demoHeading ?? "");

    const payload = {
      hero_title: heroTitlePayload,
      hero_description: heroDescription ?? "",
      sidebar_name: categoryHeading ?? "",
      hero_image: bannerImage ?? "",
      demo_title: demoTitlePayload,
      demo_subtitle: demoSubContent ?? "",
      demo_points: demoPoints.map((p) => ({
        title: p.title,
      }))      
    };

    try {
      const res = await api.post("/blog-page/update", payload);

      console.log(
        "POST /api/blog-page/update - Response status:",
        res.status,
        "ok:",
        res.status === 200
      );

      let result: Record<string, unknown> | null = null;
      try {
        result = res.data;
        console.log("Response JSON:", result);
      } catch (e) {
        console.debug("Non-JSON response", e);
        result = { message: `HTTP ${res.status}` };
      }

      let data: unknown = null;
      try {
        data = result;
      } catch {
        data = null;
      }

      console.debug(
        "POST /api/blog-page/update response status:",
        res.status,
        "body:",
        data
      );

      if (res.status < 200 || res.status >= 300) {
        const dataObj =
          data && typeof data === "object"
            ? (data as Record<string, unknown>)
            : undefined;
        const msg =
          dataObj && ("message" in dataObj || "error" in dataObj)
            ? String(dataObj["message"] ?? dataObj["error"])
            : `Status ${res.status}`;
        toast.error(String(msg));
        throw new Error(String(msg));
      }

      // success path
      // success path
      toast.success(result?.message?.toString() || "Saved successfully.");

      // re-fetch fresh data to ensure UI matches backend
      try {
        const res = await api.get("/blog-page");
        if (res.status !== 200) {
          console.warn("Could not fetch saved blog-page settings", res.status);
          return;
        }
        const data = res.data.data;
        let response: unknown = null;
        try {
          response = data;
        } catch {
          return;
        }
        if (
          response &&
          typeof response === "object" &&
          Object.keys(response as Record<string, unknown>).length > 0
        ) {
          const responseObj = response as Record<string, unknown>;
          const heroTitle =
            responseObj.hero_title && typeof responseObj.hero_title === "object"
              ? (responseObj.hero_title as Record<string, unknown>)
              : null;
          const demoTitle =
            responseObj.demo_title && typeof responseObj.demo_title === "object"
              ? (responseObj.demo_title as Record<string, unknown>)
              : null;

          // Helper: Extract title from object (handles part1/part2 format)
          const extractTitleForReload = (title: unknown): string => {
            if (!title) return "";
            if (typeof title === "string") return title;
            const titleObj = title as {
              text?: string;
              part1?: string;
              part2?: string;
            };
            if (titleObj.part1 && titleObj.part2) {
              return `${titleObj.part1} ${titleObj.part2}`;
            }
            return titleObj.text ?? "";
          };

          setHeroHeading(extractTitleForReload(heroTitle));
          setHeroDescription(String(responseObj.hero_description ?? ""));
          setCategoryHeading(String(responseObj.sidebar_name ?? ""));
          setBannerImage(String(responseObj.hero_image ?? ""));
          setDemoHeading(extractTitleForReload(demoTitle));
          setDemoSubContent(String(responseObj.demo_subtitle ?? ""));

          // Handle demo_points as array of strings - load into dynamic array
          const pointsArray = Array.isArray(responseObj.demo_points)
            ? responseObj.demo_points
            : [];

          setDemoPoints(
            pointsArray.map((point: any, index: number) => ({
              id: `demo-point-${index}-${Date.now()}`,
              title:
                typeof point === "string"
                  ? point
                  : typeof point === "object"
                    ? point.title ?? ""
                    : "",
            }))
          );

        }
      } catch (e: unknown) {
        console.debug("Failed to re-fetch after save:", e);
      }
    } catch (err: unknown) {
      let msg = "Failed to save blog page.";
      if (err instanceof Error) msg = err.message;
      else if (typeof err === "string") msg = err;
      else msg = String(err ?? msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-white p-8 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Blog Page</h1>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-1 overflow-x-auto">
          {[
            { id: "hero", label: "Blog Hero Section" },
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
          <div className="p-6 space-y-5">
            <div>
              <label
                htmlFor="page-heading"
                className="text-gray-600 block mb-1 font-semibold"
              >
                Page Heading*
              </label>
              <input
                id="page-heading"
                value={heroHeading}
                onChange={(e) => setHeroHeading(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: Simple text or &quot;Text part1 Text part2&quot; (If using parts,
                first part gets gradient styling on the website)
              </p>
            </div>
            <AdminTextarea
              label="Page Content"
              value={heroDescription}
              onChange={setHeroDescription}
            />
            <BannerBox
              label="Banner Image"
              image={bannerImage}
              onUpload={setBannerImage}
            />
            <AdminInput
              label="Category Heading"
              value={categoryHeading}
              onChange={setCategoryHeading}
            />
          </div>
        )}

        {activeTab === "demo" && (
          <div className="p-6 space-y-5">
            <div>
              <label
                htmlFor="demo-heading"
                className="text-gray-600 block mb-1 font-semibold"
              >
                Demo Section Heading*
              </label>
              <input
                id="demo-heading"
                value={demoHeading}
                onChange={(e) => setDemoHeading(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the main heading displayed on the website (e.g., &quot;Get A
                Live Free Demo&quot;)
              </p>
            </div>

            <AdminTextarea
              label="Demo Sub Content"
              value={demoSubContent}
              onChange={setDemoSubContent}
            />

            <div className="space-y-4 pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  Demo Points (Bullet Points):
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDemoPoints([
                      ...demoPoints,
                      {
                        id: `demo-point-${Date.now()}-${Math.random()}`,
                        title: "",
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
                      <label className="text-sm font-semibold text-gray-700">
                        Demo Point {index + 1}*
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newPoints = demoPoints.filter(
                            (_, i) => i !== index
                          );
                          setDemoPoints(newPoints);
                        }}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <AdminInput
                      label=""
                        value={point.title}
                        onChange={(value) => {
                          const newPoints = [...demoPoints];
                          newPoints[index] = { ...newPoints[index], title: value };
                          setDemoPoints(newPoints);
                      }}
                    />
                  </div>
                ))
              )}

              {demoPoints.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Each point will appear as a bullet point on the website
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow"
        >
          {isSaving ? "Saving..." : "Submit"}
        </button>
      </div>
    </section>
  );
}
