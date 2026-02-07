"use client";

import React, { useEffect, useState } from "react";
import TipTapEditor from "../CorporateTraining/components/TipTapEditor";
import {
  AdminCard,
  AdminInput,
  AdminTextarea,
  BannerBox,
} from "../CorporateTraining/components/AdminUI";
import toast from "react-hot-toast";
import { api } from "@/utils/axios";

/**
 * Small note:
 * - You requested T1: all rich-text fields will be empty ("") by default.
 * - Images keep a DEFAULT_IMAGE preview so UI doesn't look broken; text fields are empty.
 */
const DEFAULT_IMAGE = "/default-uploads/Skill-vedika-Logo.jpg";

type Point = {
  id: string;
  label: string;
  description: string;
  iconPreview?: string | null;
  iconFile?: File | null;
};

type Proc = {
  id: string;
  label: string;
  description: string;
};

export default function OnJobSupportPage() {
  // HERO (text fields default to empty strings — T1)
  const [pageTitle, setPageTitle] = useState<string>(""); // T1
  const [pageDescription, setPageDescription] = useState<string>(""); // T1
  const [buttonName, setButtonName] = useState<string>("");
  const [buttonLink, setButtonLink] = useState<string>("");

  // images (keep preview default image so UI has a thumbnail)
  const [heroBannerPreview, setHeroBannerPreview] = useState<string | null>(
    DEFAULT_IMAGE
  );

  // EXPERTS
  const [expertsTitle, setExpertsTitle] = useState<string>(""); // T1
  const [expertsSubTitle, setExpertsSubTitle] = useState<string>(""); // T1
  const [expertsDescription, setExpertsDescription] = useState<string>(""); // T1

  const [expertsTitle1, setExpertsTitle1] = useState<string>("");
  const [expertsContent1, setExpertsContent1] = useState<string>("");

  const [expertsTitle2, setExpertsTitle2] = useState<string>("");
  const [expertsContent2, setExpertsContent2] = useState<string>("");

  const [expertsBannerPreview, setExpertsBannerPreview] = useState<
    string | null
  >(DEFAULT_IMAGE);

  // WHO
  const [whoTitleTarget, setWhoTitleTarget] = useState<string>("");
  const [whoTitle, setWhoTitle] = useState<string>(""); // T1
  const [whoContent, setWhoContent] = useState<string>(""); // T1

  const [whoCardTitleTarget1, setWhoCardTitleTarget1] = useState<string>("");
  const [whoCardTitle1, setWhoCardTitle1] = useState<string>("");
  const [whoCardTitleContent1, setWhoCardTitleContent1] = useState<string>("");

  const [whoCardTitleTarget2, setWhoCardTitleTarget2] = useState<string>("");
  const [whoCardTitle2, setWhoCardTitle2] = useState<string>("");
  const [whoCardTitleContent2, setWhoCardTitleContent2] = useState<string>("");

  const [whoCardTitleTarget3, setWhoCardTitleTarget3] = useState<string>("");
  const [whoCardTitle3, setWhoCardTitle3] = useState<string>("");
  const [whoCardTitleContent3, setWhoCardTitleContent3] = useState<string>("");

  const [whoCardTitleTarget4, setWhoCardTitleTarget4] = useState<string>("");
  const [whoCardTitle4, setWhoCardTitle4] = useState<string>("");
  const [whoCardTitleContent4, setWhoCardTitleContent4] = useState<string>("");

  // HOW WE HELP
  const [howCardTitle, setHowCardTitle] = useState<string>("");
  const [howTitleContent, setHowTitleContent] = useState<string>("");

  const [points, setPoints] = useState<Point[]>(() => [
    { id: "p1", label: "", description: "", iconPreview: null, iconFile: null },
    { id: "p2", label: "", description: "", iconPreview: null, iconFile: null },
    { id: "p3", label: "", description: "", iconPreview: null, iconFile: null },
    { id: "p4", label: "", description: "", iconPreview: null, iconFile: null },
    { id: "p5", label: "", description: "", iconPreview: null, iconFile: null },
  ]);
  const [howFooterTitle, setHowFooterTitle] = useState<string>("");

  // PROCESS
  const [processTitle, setProcessTitle] = useState<string>("");
  const [OurProcessTitleContent, setOurProcessTitleContent] =
    useState<string>("");
  const [processes, setProcesses] = useState<Proc[]>(() => [
    { id: "proc1", label: "", description: "" },
    { id: "proc2", label: "", description: "" },
    { id: "proc3", label: "", description: "" },
    { id: "proc4", label: "", description: "" },
  ]);

  // WHY & READY
  const [whyTitle, setWhyTitle] = useState<string>("");
  const [whyContent, setWhyContent] = useState<string>(""); // T1
  const [whyBannerPreview, setWhyBannerPreview] = useState<string | null>(
    DEFAULT_IMAGE
  );

  const [readyTitle, setReadyTitle] = useState<string>("");
  const [readyButtonText, setReadyButtonText] = useState<string>("");
  const [readyDescription, setReadyDescription] = useState<string>("");
  const [readyBannerPreview, setReadyBannerPreview] = useState<string | null>(
    DEFAULT_IMAGE
  );

  // DEMO
  const [demoTarget, setDemoTarget] = useState<string>("");
  const [pageHeading, setPageHeading] = useState<string>("");
  const [pageContent, setPageContent] = useState<string>("");

  const [demoPoints, setDemoPoints] = useState<{ id: string; title: string; description: string }[]>([]);

  // UI state
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Collapsible sections state
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("hero");

  // Helpers
  const parseTwoPart = (value: string) => {
    if (!value || typeof value !== "string") return "";
  
    const match = value.match(/<span>(.*?)<\/span>/i);
  
    // ✅ No span → store plain string
    if (!match) {
      return value.trim();
    }
  
    // ✅ Span exists → store structured object
    const part2 = match[1];
    const part1 = value.replace(/<span>.*?<\/span>/i, "").trim();
  
    return {
      part1,
      part2,
    };
  };
  

  const buildHtmlFromParts = (parts: any) => {
    if (!parts) return "";
    // parts might be object like {part1, part2} or {text, title2} or array-like; be defensive
    // Handle old database format: {text, title2}
    if (parts.text !== undefined || parts.title2 !== undefined) {
      const part1 = parts.text ?? "";
      const part2 = parts.title2 ?? parts.title ?? "";
      return part2 ? `${part1}<span>${part2}</span>` : `${part1}`;
    }
    // Handle new format: {part1, part2}
    const part1 = parts.part1 ?? parts[0] ?? "";
    const part2 = parts.part2 ?? parts[1] ?? "";
    return part2 ? `${part1}<span>${part2}</span>` : `${part1}`;
  };

  // load saved data on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/on-job-support");
        if (res.status != 200) {
          return;
        }
        const data = res.data;
        const record = data.data;

        // Early return if no record exists (empty database)
        if (!record) {
          return;
        }

        // HERO
        if (record.hero_title)
          setPageTitle(buildHtmlFromParts(record.hero_title) || "");
        setPageDescription(record.hero_description ?? "");
        setButtonName(record.hero_button_text ?? "");
        setButtonLink(record.hero_button_link ?? "");
        if (record.hero_image)
          setHeroBannerPreview(record.hero_image || DEFAULT_IMAGE);

        // REALTIME / EXPERTS
        if (record.realtime_title)
          setExpertsTitle(buildHtmlFromParts(record.realtime_title) || "");
        setExpertsSubTitle(record.realtime_subheading ?? "");
        setExpertsDescription(record.realtime_description ?? "");
        setExpertsTitle1(record.realtime_subsection_title1 ?? "");
        setExpertsContent1(record.subsection_title1_description ?? "");
        setExpertsTitle2(record.realtime_subsection_title2 ?? "");
        setExpertsContent2(record.subsection_title2_description ?? "");
        if (record.realtime_image)
          setExpertsBannerPreview(record.realtime_image || DEFAULT_IMAGE);

        // WHO
        setWhoTitleTarget(record.who_target ?? "");
        if (record.who_title)
          setWhoTitle(buildHtmlFromParts(record.who_title) || "");
        setWhoContent(record.who_subtitle ?? "");
        if (Array.isArray(record.who_cards)) {
          const cards = record.who_cards;
          if (cards[0]) {
            setWhoCardTitleTarget1(
              cards[0].target ?? cards[0].title_target ?? ""
            );
            setWhoCardTitle1(cards[0].title ?? "");
            setWhoCardTitleContent1(
              cards[0].content ?? cards[0].description ?? ""
            );
          }
          if (cards[1]) {
            setWhoCardTitleTarget2(
              cards[1].target ?? cards[1].title_target ?? ""
            );
            setWhoCardTitle2(cards[1].title ?? "");
            setWhoCardTitleContent2(
              cards[1].content ?? cards[1].description ?? ""
            );
          }
          if (cards[2]) {
            setWhoCardTitleTarget3(
              cards[2].target ?? cards[2].title_target ?? ""
            );
            setWhoCardTitle3(cards[2].title ?? "");
            setWhoCardTitleContent3(
              cards[2].content ?? cards[2].description ?? ""
            );
          }
          if (cards[3]) {
            setWhoCardTitleTarget4(
              cards[3].target ?? cards[3].title_target ?? ""
            );
            setWhoCardTitle4(cards[3].title ?? "");
            setWhoCardTitleContent4(
              cards[3].content ?? cards[3].description ?? ""
            );
          }
        }

        // HOW
        if (record.how_title)
          setHowCardTitle(buildHtmlFromParts(record.how_title) || "");
        setHowTitleContent(record.how_subtitle ?? "");
        if (Array.isArray(record.how_points)) {
          setPoints(
            record.how_points.map((p: any, idx: number) => ({
              id: p.id ?? `p${idx + 1}`,
              label: p.label ?? "",
              description: p.description ?? "",
              iconPreview: p.iconPreview ?? null,
              iconFile: null,
            }))
          );
        } else {
          // keep default (empty) points
        }
        setHowFooterTitle(record.how_footer ?? "");

        // PROCESS
        if (record.process_title)
          setProcessTitle(buildHtmlFromParts(record.process_title) || "");
        setOurProcessTitleContent(record.process_subtitle ?? "");
        if (Array.isArray(record.process_points)) {
          setProcesses(
            record.process_points.map((pr: any, idx: number) => ({
              id: pr.id ?? `proc${idx + 1}`,
              label: pr.label ?? "",
              description: pr.description ?? "",
            }))
          );
        }

        // WHY
        if (record.why_title)
          setWhyTitle(buildHtmlFromParts(record.why_title) || "");
        if (record.why_points) {
          // Join array of points back into HTML for TipTapEditor
          if (Array.isArray(record.why_points) && record.why_points.length > 0) {
            // Convert array of strings to HTML with <p> tags
            const htmlContent = record.why_points
              .filter((point: string) => point && point.trim() !== '')
              .map((point: string) => `<p>${point.trim()}</p>`)
              .join('');
            setWhyContent(htmlContent);
          } else if (typeof record.why_points === "string") {
            setWhyContent(record.why_points ?? "");
          }
        }

        if (record.why_image) {
          setWhyBannerPreview(record.why_image || DEFAULT_IMAGE);
        }

        // READY
          if (record.ready_title)
          setReadyTitle(buildHtmlFromParts(record.ready_title) || "");
        setReadyDescription(record.ready_description ?? "");
        setReadyButtonText(record.ready_button ?? "");
        setButtonLink(record.ready_button_link ?? "");
        if (record.ready_image)
          setReadyBannerPreview(record.ready_image || DEFAULT_IMAGE);

        // DEMO
        // Handle demo_title - can be string, object with part1/part2, or object with main/text
        if (record.demo_title) {
          try {
            if (typeof record.demo_title === "string") {
              setPageHeading(record.demo_title);
            } else if (typeof record.demo_title === "object") {
              const dt = record.demo_title;
              if (dt.part1 || dt.part2) {
                const part1 = dt.part1 ?? "";
                const part2 = dt.part2 ? `<span>${dt.part2}</span>` : "";
                setPageHeading(`${part1}${part2}`);
              } else if (dt.main || dt.text) {
                setPageHeading(dt.main ?? dt.text ?? "");
              }
            }
          } catch (error_) {
            // Fallback: if demo_title parsing fails, try to extract from demo_target
            if (record.demo_target) {
              setPageHeading(record.demo_target);
            }
          }
        } else if (record.demo_target) {
          // If demo_title doesn't exist, try demo_target as fallback
          setPageHeading(record.demo_target);
        }
        
        // Load demo_target separately for the badge
        setDemoTarget(record.demo_target ?? "");
        setPageContent(record.demo_subtitle ?? "");
        
        // Handle demo_points - can be array of objects or array of strings
        if (Array.isArray(record.demo_points) && record.demo_points.length > 0) {
          const dp = record.demo_points;
          setDemoPoints(
            dp.map((item: any, index: number) => {
              if (typeof item === "string") {
                return {
                  id: `demo-point-${index}-${Date.now()}`,
                  title: item,
                  description: "",
                };
              } else {
                return {
                  id: `demo-point-${index}-${Date.now()}`,
                  title: item.title ?? item.label ?? "",
                  description: item.description ?? item.content ?? "",
                };
              }
            })
          );
        } else {
          setDemoPoints([]);
        }
      } catch (err) {
        // Failed to load on-job-support content
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Build final payload and POST to backend
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);

    const who_cards = [
      {
        target: whoCardTitleTarget1 || "",
        title: whoCardTitle1 || "",
        content: whoCardTitleContent1 || "",
      },
      {
        target: whoCardTitleTarget2 || "",
        title: whoCardTitle2 || "",
        content: whoCardTitleContent2 || "",
      },
      {
        target: whoCardTitleTarget3 || "",
        title: whoCardTitle3 || "",
        content: whoCardTitleContent3 || "",
      },
      {
        target: whoCardTitleTarget4 || "",
        title: whoCardTitle4 || "",
        content: whoCardTitleContent4 || "",
      },
    ];

    const how_points = points.map((p) => ({
      label: p.label || "",
      description: p.description || "",
    }));
    const process_points = processes.map((pr) => ({
      label: pr.label || "",
      description: pr.description || "",
    }));

    const demo_points = demoPoints
      .filter((point) => point.title?.trim())
      .map((point) => ({
        title: point.title.trim(),
        description: point.description.trim() || "",
      }));

    // Parse HTML content from TipTapEditor and split into individual points
    // Extract text from <p> tags or split by line breaks
    const parseWhyPoints = (htmlContent: string): string[] => {
      if (!htmlContent || typeof htmlContent !== 'string') return [];
      
      // Check if we're in a browser environment
      if (typeof document === 'undefined') {
        // Server-side: use regex to extract text from <p> tags
        const pMatches = htmlContent.match(/<p[^>]*>(.*?)<\/p>/gi);
        if (pMatches && pMatches.length > 0) {
          return pMatches
            .map(match => {
              // Remove HTML tags and decode entities
              const text = match.replace(/<[^>]*>/g, '').trim();
              return text;
            })
            .filter(text => text !== '');
        }
        // Try splitting by <br> tags
        const brSplit = htmlContent.split(/<br\s*\/?>/i);
        if (brSplit.length > 1) {
          return brSplit
            .map(text => text.replace(/<[^>]*>/g, '').trim())
            .filter(text => text !== '');
        }
        // Fallback: remove all HTML tags
        const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
        return textContent ? [textContent] : [];
      }
      
      // Client-side: use DOM APIs for better parsing
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Extract text from <p> tags
        const paragraphs = tempDiv.querySelectorAll('p');
        if (paragraphs.length > 0) {
          return Array.from(paragraphs)
            .map(p => p.textContent?.trim() || '')
            .filter(text => text !== '');
        }
        
        // If no <p> tags, try splitting by <br> tags
        const brSplit = htmlContent.split(/<br\s*\/?>/i);
        if (brSplit.length > 1) {
          return brSplit
            .map(text => {
              const temp = document.createElement('div');
              temp.innerHTML = text;
              return (temp.textContent || temp.innerText || '').trim();
            })
            .filter(text => text !== '');
        }
        
        // Fallback: extract all text content
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        if (textContent.trim()) {
          return [textContent.trim()];
        }
      } catch (error) {
        // Fallback to regex-based parsing
        const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();
        return textContent ? [textContent] : [];
      }
      
      return [];
    };
    
    const why_points_array = parseWhyPoints(whyContent || "");

    const payload = {
      hero_title: parseTwoPart(pageTitle || ""),
      hero_description: pageDescription || "",
      hero_button_text: buttonName || "",
      hero_button_link: buttonLink || "",
      hero_image: heroBannerPreview || null,

      realtime_title: parseTwoPart(expertsTitle || ""),
      realtime_subheading: expertsSubTitle || "",
      realtime_description: expertsDescription || "",
      realtime_subsection_title1: expertsTitle1 || "",
      subsection_title1_description: expertsContent1 || "",
      realtime_subsection_title2: expertsTitle2 || "",
      subsection_title2_description: expertsContent2 || "",
      realtime_image: expertsBannerPreview || null,

      who_target: whoTitleTarget || "",
      who_title: parseTwoPart(whoTitle || ""),
      who_subtitle: whoContent || "",
      who_cards: who_cards,

      how_title: parseTwoPart(howCardTitle || ""),
      how_subtitle: howTitleContent || "",
      how_points: how_points,
      how_footer: howFooterTitle || "",

      process_title: parseTwoPart(processTitle || ""),
      process_subtitle: OurProcessTitleContent || "",
      process_points: process_points,

      why_title: parseTwoPart(whyTitle || ""),
      why_points: why_points_array,
      why_image: whyBannerPreview || null,

      ready_title: parseTwoPart(readyTitle || ""),
      ready_description: readyDescription || "",
      ready_button: readyButtonText || "",
      ready_button_link: buttonLink || "",
      ready_image: readyBannerPreview || null,

      demo_target: demoTarget || "",
      demo_title: parseTwoPart(pageHeading || ""),
      demo_subtitle: pageContent || "",
      demo_points: demo_points,
    };

    try {
      const res = await api.post("/on-job-support", payload);
      if (res.status != 201) {
        toast.error("Save failed: " + (res.data.message || "Server error"));
        return;
      }
      toast.success("Saved successfully");
    } catch (err) {
      toast.error("Network error, check the server");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminCard title="">
      <div className="min-h-screen bg-gray-50 p-0">
        <div className="mx-auto space-y-4">
          <h1 className="text-2xl font-bold">On Job Support</h1>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-1 overflow-x-auto">
              {[
                { id: "hero", label: "Hero Section" },
                { id: "experts", label: "Industry Experts" },
                { id: "who", label: "Who We Help" },
                { id: "how", label: "How We Help" },
                { id: "process", label: "Our Process" },
                { id: "why", label: "Why Choose Us" },
                { id: "ready", label: "Ready to Empower" },
                { id: "demo", label: "Live Free Demo" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "border-[#1A3F66] text-[#1A3F66]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tab Content */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {activeTab === "hero" && (
                <div className="p-6 space-y-4">
                <div>
                  <AdminInput
                    label="Page Title*"
                    value={pageTitle ?? ""}
                    onChange={setPageTitle}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: &quot;Text &lt;span&gt;Highlighted Text&lt;/span&gt;&quot; (Text inside &lt;span&gt; tags will appear highlighted on the website)
                  </p>
                </div>

                <div>
                  <label htmlFor="page-description" className="text-gray-600 font-semibold mb-1 block">
                    Page Description*
                  </label>
                  <div className="mt-2">
                    <TipTapEditor
                      value={pageDescription ?? ""}
                      onChange={setPageDescription}
                    />
                  </div>
                </div>

                <BannerBox
                  label="Select Banner Image"
                  image={heroBannerPreview || DEFAULT_IMAGE}
                  onUpload={(urlOrPreview) => {
                    // BannerBox returns final Cloudinary URL (or preview). Save URL.
                    setHeroBannerPreview(urlOrPreview || DEFAULT_IMAGE);
                  }}
                />

                <AdminInput
                  label="Button Name*"
                  value={buttonName ?? ""}
                  onChange={setButtonName}
                />

                <AdminInput
                  label="Button Link*"
                  value={buttonLink ?? ""}
                  onChange={setButtonLink}
                />
                </div>
              )}

              {activeTab === "experts" && (
                <div className="p-6 space-y-4">
                <div>
                  <AdminInput
                    label="Main Title*"
                    value={expertsTitle ?? ""}
                    onChange={setExpertsTitle}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: &quot;Text &lt;span&gt;Highlighted Text&lt;/span&gt;&quot; (Text inside &lt;span&gt; tags will appear highlighted on the website)
                  </p>
                </div>

                <AdminInput
                  label="Sub Title*"
                  value={expertsSubTitle ?? ""}
                  onChange={setExpertsSubTitle}
                />

                <div>
                  <label htmlFor="experts-description" className="text-gray-600 font-semibold mb-1 block">
                    Main Description*
                  </label>
                  <div className="mt-2">
                    <TipTapEditor
                      value={expertsDescription ?? ""}
                      onChange={setExpertsDescription}
                    />
                  </div>
                </div>

                <AdminCard title="Experts Sub Section 1">
                  <AdminInput
                    label="Title 1*"
                    value={expertsTitle1 ?? ""}
                    onChange={setExpertsTitle1}
                  />

                  <AdminTextarea
                    label="Description Content 1*"
                    value={expertsContent1 ?? ""}
                    onChange={setExpertsContent1}
                    rows={5}
                  />
                </AdminCard>

                <AdminCard title="Experts Sub Section 2">
                  <AdminInput
                    label="Title 2*"
                    value={expertsTitle2 ?? ""}
                    onChange={setExpertsTitle2}
                  />

                  <AdminTextarea
                    label="Description Content 2*"
                    value={expertsContent2 ?? ""}
                    onChange={setExpertsContent2}
                    rows={5}
                  />
                </AdminCard>

                <BannerBox
                  label="Select Banner Image"
                  image={expertsBannerPreview || DEFAULT_IMAGE}
                  onUpload={(preview) =>
                    setExpertsBannerPreview(preview || DEFAULT_IMAGE)
                  }
                />
                </div>
              )}

              {activeTab === "who" && (
                <div className="p-6 space-y-4">
                <AdminInput
                  label="Title target*"
                  value={whoTitleTarget ?? ""}
                  onChange={setWhoTitleTarget}
                />
                <div>
                  <AdminInput
                    label="Title*"
                    value={whoTitle ?? ""}
                    onChange={setWhoTitle}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: &quot;Text &lt;span&gt;Highlighted Text&lt;/span&gt;&quot; (Text inside &lt;span&gt; tags will appear highlighted on the website)
                  </p>
                </div>
                <div>
                  <label htmlFor="who-content" className="text-gray-600 font-semibold mb-1 block">
                    Content*
                  </label>
                  <div className="mt-2">
                    <TipTapEditor
                      value={whoContent ?? ""}
                      onChange={setWhoContent}
                    />
                  </div>
                </div>

                {/* WHO Cards (1-4) */}
                <AdminCard title="">
                  <AdminInput
                    label="Card Title Target 1*"
                    value={whoCardTitleTarget1 ?? ""}
                    onChange={setWhoCardTitleTarget1}
                  />

                  <AdminInput
                    label="Card Title 1*"
                    value={whoCardTitle1 ?? ""}
                    onChange={setWhoCardTitle1}
                  />

                  <AdminTextarea
                    label="Card Title Content 1*"
                    value={whoCardTitleContent1 ?? ""}
                    onChange={setWhoCardTitleContent1}
                    rows={5}
                  />
                </AdminCard>

                <AdminCard title="">
                  <AdminInput
                    label="Card Title Target 2*"
                    value={whoCardTitleTarget2 ?? ""}
                    onChange={setWhoCardTitleTarget2}
                  />

                  <AdminInput
                    label="Card Title 2*"
                    value={whoCardTitle2 ?? ""}
                    onChange={setWhoCardTitle2}
                  />

                  <AdminTextarea
                    label="Card Title Content 2*"
                    value={whoCardTitleContent2 ?? ""}
                    onChange={setWhoCardTitleContent2}
                    rows={5}
                  />
                </AdminCard>

                <AdminCard title="">
                  <AdminInput
                    label="Card Title Target 3*"
                    value={whoCardTitleTarget3 ?? ""}
                    onChange={setWhoCardTitleTarget3}
                  />

                  <AdminInput
                    label="Card Title 3*"
                    value={whoCardTitle3 ?? ""}
                    onChange={setWhoCardTitle3}
                  />

                  <AdminTextarea
                    label="Card Title Content 3*"
                    value={whoCardTitleContent3 ?? ""}
                    onChange={setWhoCardTitleContent3}
                    rows={5}
                  />
                </AdminCard>

                <AdminCard title="">
                  <AdminInput
                    label="Card Title Target 4*"
                    value={whoCardTitleTarget4 ?? ""}
                    onChange={setWhoCardTitleTarget4}
                  />

                  <AdminInput
                    label="Card Title 4*"
                    value={whoCardTitle4 ?? ""}
                    onChange={setWhoCardTitle4}
                  />

                  <AdminTextarea
                    label="Card Title Content 4*"
                    value={whoCardTitleContent4 ?? ""}
                    onChange={setWhoCardTitleContent4}
                    rows={5}
                  />
                </AdminCard>
                </div>
              )}

              {activeTab === "how" && (
                <div className="p-6 space-y-4">
                <div>
                  <AdminInput
                    label="Title*"
                    value={howCardTitle ?? ""}
                    onChange={setHowCardTitle}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: &quot;Text &lt;span&gt;Highlighted Text&lt;/span&gt;&quot; (Text inside &lt;span&gt; tags will appear highlighted on the website)
                  </p>
                </div>

                <AdminTextarea
                  label="Content*"
                  value={howTitleContent ?? ""}
                  onChange={setHowTitleContent}
                  rows={5}
                />

                {points.map((pt, idx) => (
                  <AdminCard key={pt.id} title={`Point ${idx + 1}`}>
                    <div className="space-y-4">
                      <AdminInput
                        label="Label*"
                        value={pt.label ?? ""}
                        onChange={(v) =>
                          setPoints((prev) =>
                            prev.map((p) =>
                              p.id === pt.id ? { ...p, label: v } : p
                            )
                          )
                        }
                      />

                      <div>
                        <label htmlFor={`point-${pt.id}-description`} className="text-gray-600 font-semibold mb-1 block">
                          Description*
                        </label>
                        <div className="mt-2">
                          <TipTapEditor
                            value={pt.description ?? ""}
                            onChange={(html: string) =>
                              setPoints((prev) =>
                                prev.map((p) =>
                                  p.id === pt.id
                                    ? { ...p, description: html }
                                    : p
                                )
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </AdminCard>
                ))}

                <AdminInput
                  label="How We Help Footer*"
                  value={howFooterTitle ?? ""}
                  onChange={setHowFooterTitle}
                />
                </div>
              )}

              {activeTab === "process" && (
                <div className="p-6 space-y-4">
                  <div>
                    <AdminInput
                      label="Title*"
                      value={processTitle ?? ""}
                      onChange={setProcessTitle}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: &quot;Text &lt;span&gt;Highlighted Text&lt;/span&gt;&quot; (Text inside &lt;span&gt; tags will appear highlighted on the website)
                    </p>
                  </div>

                  <AdminTextarea
                    label="Content*"
                    value={OurProcessTitleContent ?? ""}
                    onChange={setOurProcessTitleContent}
                    rows={5}
                  />

                  {processes.map((proc, idx) => (
                    <AdminCard key={proc.id} title={`Process ${idx + 1}`}>
                      <div className="space-y-4">
                        <AdminInput
                          label="Label*"
                          value={proc.label ?? ""}
                          onChange={(v) =>
                            setProcesses((prev) =>
                              prev.map((p) =>
                                p.id === proc.id ? { ...p, label: v } : p
                              )
                            )
                          }
                        />

                        <div>
                          <label htmlFor={`process-${proc.id}-description`} className="text-gray-600 font-semibold mb-1 block">
                            Description*
                          </label>
                          <div className="mt-2">
                            <TipTapEditor
                              value={proc.description ?? ""}
                              onChange={(html: string) =>
                                setProcesses((prev) =>
                                  prev.map((p) =>
                                    p.id === proc.id
                                      ? { ...p, description: html }
                                      : p
                                  )
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </AdminCard>
                  ))}
                </div>
              )}

              {activeTab === "why" && (
                <div className="p-6 space-y-4">
                <div>
                  <AdminInput
                    label="Title*"
                    value={whyTitle ?? ""}
                    onChange={setWhyTitle}
                  />
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    <strong>Format Instructions:</strong> To create a two-part title with a highlighted subtitle:
                  </p>
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                    <div className="bg-white p-2 rounded border border-blue-200">
                      <p className="font-semibold text-blue-700 mb-1">✅ Two-Part Title (Recommended):</p>
                      <p className="mb-1">Enter: <code className="bg-gray-100 px-2 py-1 rounded text-blue-800">Why Choose &lt;span&gt;SkillVedika?&lt;/span&gt;</code></p>
                      <p className="text-gray-600 text-xs">Website shows: <span className="font-semibold">&quot;Why Choose&quot;</span> (normal) + <span className="font-semibold text-blue-600">&quot;SkillVedika?&quot;</span> (highlighted)</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-200">
                      <p className="font-semibold text-gray-700 mb-1">Single Title:</p>
                      <p className="mb-1">Enter: <code className="bg-gray-100 px-2 py-1 rounded">Why Choose Us</code></p>
                      <p className="text-gray-600 text-xs">Website shows: <span className="font-semibold">&quot;Why Choose Us&quot;</span> (all normal, no highlight)</p>
                    </div>
                    <p className="text-red-600 font-semibold mt-2">💡 Tip: To change the subtitle (highlighted part), wrap it in &lt;span&gt; tags!</p>
                  </div>
                </div>
                <div>
                  <label htmlFor="why-content" className="text-gray-600 font-semibold mb-1 block">
                    Content*
                  </label>
                  <div className="mt-2">
                    <TipTapEditor
                      value={whyContent ?? ""}
                      onChange={setWhyContent}
                    />
                  </div>
                </div>

                <BannerBox
                  label="Select Banner Image"
                  image={whyBannerPreview || DEFAULT_IMAGE}
                  onUpload={(urlOrPreview) => {
                    // BannerBox returns final Cloudinary URL (or preview). Save URL.
                    setWhyBannerPreview(urlOrPreview || DEFAULT_IMAGE);
                  }}
                />
                </div>
              )}

              {activeTab === "ready" && (
                <div className="p-6 space-y-4">
                <div>
                  <AdminInput
                    label="Title*"
                    value={readyTitle ?? ""}
                    onChange={setReadyTitle}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: &quot;Text &lt;span&gt;Highlighted Text&lt;/span&gt;&quot; (Text inside &lt;span&gt; tags will appear highlighted on the website)
                  </p>
                </div>
                <AdminInput
                  label="Button Text*"
                  value={readyButtonText ?? ""}
                  onChange={setReadyButtonText}
                />

                <div>
                  <label htmlFor="ready-description" className="text-gray-600 font-semibold mb-1 block">
                    Description*
                  </label>
                  <div className="mt-2">
                    <TipTapEditor
                      value={readyDescription ?? ""}
                      onChange={setReadyDescription}
                    />
                  </div>
                </div>

                <BannerBox
                  label="Select Banner Image"
                  image={readyBannerPreview || DEFAULT_IMAGE}
                  onUpload={(pr) => setReadyBannerPreview(pr || DEFAULT_IMAGE)}
                />
                </div>
              )}

              {activeTab === "demo" && (
                <div className="p-6 space-y-4">
              <AdminInput
                label="Target (Badge Text)*"
                value={demoTarget ?? ""}
                onChange={setDemoTarget}
              />
              <p className="text-xs text-gray-500 mt-1 mb-4">
                This text appears as a badge/tag above the title (e.g., &quot;Limited Spots Available&quot;, &quot;Get a Live Free Demo&quot;)
              </p>
              <div>
                <AdminInput
                  label="Demo Section Heading*"
                  value={pageHeading ?? ""}
                  onChange={setPageHeading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: &quot;Text &lt;span&gt;Highlighted Text&lt;/span&gt;&quot; (Text inside &lt;span&gt; tags will appear highlighted on the website)
                </p>
              </div>
              <AdminTextarea
                label="Demo Content*"
                value={pageContent ?? ""}
                onChange={setPageContent}
              />

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
                          title: "",
                          description: "",
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
                        value={point.title}
                        onChange={(value) => {
                          const newPoints = [...demoPoints];
                          newPoints[index] = { ...newPoints[index], title: value };
                          setDemoPoints(newPoints);
                        }}
                      />
                      <AdminTextarea
                        label="Demo Content"
                        value={point.description}
                        onChange={(value) => {
                          const newPoints = [...demoPoints];
                          newPoints[index] = { ...newPoints[index], description: value };
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

            {/* SUBMIT */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminCard>
  );
}
