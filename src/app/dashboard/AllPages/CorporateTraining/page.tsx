"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import HeroSection from "./components/HeroSection";
import EmpowerSection from "./components/EmpowerSection";
import PortfolioSection from "./components/PortfolioSection";
import AdvantageSection from "./components/AdvantageSection";
import TalentSection from "./components/TalentSection";
import {
  AdminInput,
} from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";
import { api } from "@/utils/axios";

export default function Page() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [hero, setHero] = useState<any>({});
  const [empower, setEmpower] = useState<any>({});
  const [portfolio, setPortfolio] = useState<any>({});
  const [advantage, setAdvantage] = useState<any>({});
  const [talent, setTalent] = useState<any>({});

  const [pageHeading, setPageHeading] = useState("");
  const [demoPoints, setDemoPoints] = useState<{ id: string; text: string }[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("hero");

  // stable merging updater for child sections to avoid accidental replacement
  const updateTalent = useCallback((partial: any) => {
    setTalent((prev: any) => ({ ...prev, ...partial }));
  }, []);

  /* --------------------------------------------------
      Helpers to Build JSON expected by Laravel Migration
  -------------------------------------------------- */

  // NOTE: treat hero title as plain text. Previously we parsed <span> markup which
  // caused user-typed '<span>' to be interpreted as HTML and stripped on save.
  // To preserve exactly what the user types, we no longer parse markup here.
  const parseHeroTitle = (html: any) => {
    return { part1: (html ?? "").toString().trim(), highlight: "" };
  };

  // Keep empower title as plain text as well to avoid treating user input as markup
  const splitEmpowerTitle = (html: any) => {
    return { part1: (html ?? "").toString().trim(), part2: "" };
  };

  // Authentication is handled via HTTP-only cookies, no token storage needed

  // Helper: Build hero title from parts
  const buildHeroTitle = (heroTitle: unknown): string => {
    if (!heroTitle) return "";
    const titleObj = heroTitle as { part1?: string; highlight?: string };
    const part1 = titleObj.part1 ?? "";
    const highlight = titleObj.highlight ?? "";
    return highlight ? `${part1} ${highlight}` : part1;
  };

  // Helper: Build empower title from parts
  const buildEmpowerTitle = (empowerTitle: unknown): string => {
    if (!empowerTitle) return "";
    const titleObj = empowerTitle as { part1?: string; part2?: string };
    const part1 = titleObj.part1 ?? "";
    const part2 = titleObj.part2 ?? "";
    return part2 ? `${part1} ${part2}` : part1;
  };

  // Helper: Extract portfolio title
  const getPortfolioTitle = (portfolioTitle: unknown): string => {
    if (typeof portfolioTitle === "string") return portfolioTitle;
    const titleObj = portfolioTitle as { text?: string } | undefined;
    return titleObj?.text ?? "";
  };

  // Helper: Extract advantages title (handles multiple formats)
  // Displays as readable text: "The SkillVedika Advantage"
  const getAdvantagesTitle = (advantagesTitle: unknown): string => {
    if (!advantagesTitle) return "";
    if (typeof advantagesTitle === "string") return advantagesTitle;
    const titleObj = advantagesTitle as { 
      title?: string | null; 
      part1?: string; 
      part3?: string; 
      highlight?: string;
    } | undefined;
    if (titleObj?.title) return titleObj.title;
    // Build from parts: "part1 highlight part3"
    const parts = [];
    if (titleObj?.part1) parts.push(titleObj.part1);
    if (titleObj?.highlight) parts.push(titleObj.highlight);
    if (titleObj?.part3) parts.push(titleObj.part3);
    return parts.join(" ") || "";
  };

  // Helper: Parse advantages title input and convert to database format
  // User can input: "The SkillVedika Advantage" or "The <highlight>SkillVedika</highlight> Advantage"
  const parseAdvantagesTitle = (input: string): { part1?: string; highlight?: string; part3?: string; title?: string | null } => {
    if (!input || !input.trim()) return { title: null };
    const trimmed = input.trim();
    
    // Check for highlight tags: <highlight>text</highlight>
    const highlightTagMatch = trimmed.match(/<highlight>(.*?)<\/highlight>/i);
    if (highlightTagMatch && highlightTagMatch.index !== undefined) {
      const highlight = highlightTagMatch[1].trim();
      const before = trimmed.substring(0, highlightTagMatch.index).trim();
      const after = trimmed.substring(highlightTagMatch.index + highlightTagMatch[0].length).trim();
      return {
        part1: before || undefined,
        highlight: highlight || undefined,
        part3: after || undefined,
      };
    }
    
    // Try to detect "SkillVedika" as highlight if it appears in the text
    const skillVedikaMatch = trimmed.match(/\b(SkillVedika)\b/i);
    if (skillVedikaMatch && skillVedikaMatch.index !== undefined) {
      const highlight = skillVedikaMatch[1];
      const parts = trimmed.split(new RegExp(String.raw`\b${highlight}\b`, 'i'));
      const part1 = parts[0]?.trim() || undefined;
      const part3 = parts[1]?.trim() || undefined;
      if (part1 || part3) {
        return { part1, highlight, part3 };
      }
    }
    
    // Default: save as simple title
    return { title: trimmed };
  };

  // Helper: Extract hr_guide title (handles multiple formats)
  // Displays as readable text: "SkillVedika for Talent Development"
  const getHrGuideTitle = (hrGuideTitle: unknown): string => {
    if (!hrGuideTitle) return "";
    if (typeof hrGuideTitle === "string") return hrGuideTitle;
    const titleObj = hrGuideTitle as { 
      title?: string | null; 
      part1?: string; 
      part2?: string;
    } | undefined;
    if (titleObj?.title) return titleObj.title;
    // Build from parts: "part1 part2" (part1 will be gradient on website)
    const parts = [];
    if (titleObj?.part1) parts.push(titleObj.part1);
    if (titleObj?.part2) parts.push(titleObj.part2);
    return parts.join(" ") || "";
  };

  // Helper: Parse hr_guide title input and convert to database format
  // User can input: "SkillVedika for Talent Development" or "SkillVedika <part1>for Talent Development</part1>"
  const parseHrGuideTitle = (input: string): { part1?: string; part2?: string; title?: string | null } => {
    if (!input || !input.trim()) return { title: null };
    const trimmed = input.trim();
    
    // Check for part1 tags: <part1>text</part1>
    const part1TagMatch = trimmed.match(/<part1>(.*?)<\/part1>/i);
    if (part1TagMatch && part1TagMatch.index !== undefined) {
      const part1 = part1TagMatch[1].trim();
      const before = trimmed.substring(0, part1TagMatch.index).trim();
      const after = trimmed.substring(part1TagMatch.index + part1TagMatch[0].length).trim();
      return {
        part1: before || part1 || undefined,
        part2: after || undefined,
      };
    }
    
    // Try to detect "SkillVedika" as part1 if it appears at the start
    const skillVedikaMatch = trimmed.match(/^(SkillVedika)\s+(.+)$/i);
    if (skillVedikaMatch) {
      return {
        part1: skillVedikaMatch[1],
        part2: skillVedikaMatch[2],
      };
    }
    
    // Default: save as simple title
    return { title: trimmed };
  };

  // Helper: Extract demo title (handles multiple formats)
  const getDemoTitle = (demoTitle: unknown): string => {
    if (!demoTitle) return "";
    if (typeof demoTitle === "string") return demoTitle;
    const titleObj = demoTitle as { 
      title?: string | null; 
      main?: string;
    } | undefined;
    return titleObj?.main || titleObj?.title || "";
  };

  

  const buildPayload = () => {
    return {
      hero_title: parseHeroTitle(hero.title || ""),
      hero_subheading: hero.description || "",
      hero_button_text: hero.buttonName || "",
      hero_button_link: hero.buttonLink || "",
      hero_image: hero.banner || "",

      empower_title: splitEmpowerTitle(empower.title || ""),
      empower_description: empower.content || "",
      empower_image: empower.banner || "",

      portfolio_title: { text: (typeof portfolio.title === 'string' ? portfolio.title : portfolio.title?.text || "") || "" },
      portfolio_subtitle: portfolio.description || "",
      portfolio_items: Array.isArray(portfolio.items) ? portfolio.items : [],

      advantages_title: parseAdvantagesTitle(advantage.title || ""),
      advantages_subtitle: advantage.desc || "",
      advantages_left_items: Array.isArray(advantage.sections) 
        ? advantage.sections.slice(0, 4).map((sec: any) => ({
            title: sec.title || "",
            description: sec.content || sec.description || "",
          }))
        : [],
      advantages_right_items: Array.isArray(advantage.sections) 
        ? advantage.sections.slice(4, 8).map((sec: any) => ({
            title: sec.title || "",
            description: sec.content || sec.description || "",
          }))
        : [],

      hr_guide_title: parseHrGuideTitle(talent.title || ""),
      hr_guide_subtitle: talent.description || talent.desc || "",
      hr_guide_steps: Array.isArray(talent.points) ? talent.points : [],

      demo_title: pageHeading ? { main: pageHeading } : { main: pageHeading || "" },
      demo_points: demoPoints
        .map((point) => point.text?.trim())
        .filter((point: string) => point && point !== ''),
    };
  };

  /* --------------------------------------------------
                Submit Handler (FINAL)
  -------------------------------------------------- */
  const handleSubmit = async () => {
    setIsSaving(true);
    const payload = buildPayload();
    console.log(payload);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      const res = await api.post("/corporate-training", payload);
      const data = res.data;
      if (res.status == 201) {
        toast.success("Saved Successfully!");
        // update local state from returned record if available
        if (data.data) {
          const record = data.data;
          // hydrate hero
          setHero({
            // Keep title as plain text (do not inject <span> markup)
            title: buildHeroTitle(record.hero_title),
            description: record.hero_subheading ?? "",
            buttonName: record.hero_button_text ?? "",
            buttonLink: record.hero_button_link ?? "",
            banner: record.hero_image ?? "",
          });

          setEmpower({
            // Keep empower title as plain text
            title: buildEmpowerTitle(record.empower_title),
            content: record.empower_description ?? "",
            banner: record.empower_image ?? "",
          });

          // Normalize portfolio items to ensure they have label and description
          const normalizedItems = Array.isArray(record.portfolio_items) 
            ? record.portfolio_items.map((item: any) => ({
                label: item.label || item.title || "",
                description: item.description || item.content || "",
                ...item, // Preserve any other fields
              }))
            : [];

          setPortfolio({
            title: getPortfolioTitle(record.portfolio_title),
            description: record.portfolio_subtitle ?? "",
            items: normalizedItems,
          });

          // Normalize advantage sections - handle both title/description and title/content formats
          const normalizedAdvantageSections = [
            ...(Array.isArray(record.advantages_left_items) ? record.advantages_left_items : []),
            ...(Array.isArray(record.advantages_right_items) ? record.advantages_right_items : []),
          ].map((section: any) => ({
            title: section.title || "",
            content: section.content || section.description || "",
            ...section, // Preserve other fields
          }));

          setAdvantage({
            title: getAdvantagesTitle(record.advantages_title),
            desc: record.advantages_subtitle ?? "",
            sections: normalizedAdvantageSections,
          });

          setTalent({
            title: getHrGuideTitle(record.hr_guide_title),
            description: record.hr_guide_subtitle ?? "",
            desc: record.hr_guide_subtitle ?? "", // Keep both for compatibility
            points: record.hr_guide_steps ?? [],
          });

          setPageHeading(getDemoTitle(record.demo_title));
          // Handle demo_points as array of strings - load into dynamic array
          const pointsArray = Array.isArray(record.demo_points) ? record.demo_points : [];
          setDemoPoints(
            pointsArray.map((text: string, index: number) => ({
              id: `demo-point-${index}-${Date.now()}`,
              text: text || "",
            }))
          );
        }
      } else {
        toast.error("Error: " + (data.message || "Failed to save"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Request failed!");
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch existing corporate training data on mount
  useEffect(() => {
    let mounted = true;
    let showLoading = false;
    
    // Show loading indicator only if loading takes more than 500ms
    const timeout = setTimeout(() => {
      if (mounted) {
        showLoading = true;
        setIsLoading(true);
      }
    }, 500);

    (async () => {
      try {
        const headers: Record<string, string> = { Accept: "application/json" };

        const res = await api.get("/corporate-training");
        if (res.status != 200) {
          console.error(
            "GET corporate-training failed:",
            res.status,
            res.statusText
          );
          if (mounted) {
            clearTimeout(timeout);
            if (showLoading) {
              setIsLoading(false);
            }
          }
          return;
        }
       
        const data = res.data;
        const record = data.data;
        console.log(record);
        if (!record || !mounted) {
          clearTimeout(timeout);
          if (showLoading) {
            setIsLoading(false);
          }
          return;
        }

        setHero({
          title: buildHeroTitle(record.hero_title),
          description: record.hero_subheading ?? "",
          buttonName: record.hero_button_text ?? "",
          buttonLink: record.hero_button_link ?? "",
          banner: record.hero_image ?? "",
        });

        setEmpower({
          title: buildEmpowerTitle(record.empower_title),
          content: record.empower_description ?? "",
          banner: record.empower_image ?? "",
        });

        // Normalize portfolio items to ensure they have label and description
        const normalizedItems = Array.isArray(record.portfolio_items) 
          ? record.portfolio_items.map((item: any) => ({
              label: item.label || item.title || "",
              description: item.description || item.content || "",
              ...item, // Preserve any other fields
            }))
          : [];

        setPortfolio({
          title: getPortfolioTitle(record.portfolio_title),
          description: record.portfolio_subtitle ?? "",
          items: normalizedItems,
        });

        // Normalize advantage sections - handle both title/description and title/content formats
        const normalizedAdvantageSections = [
          ...(Array.isArray(record.advantages_left_items) ? record.advantages_left_items : []),
          ...(Array.isArray(record.advantages_right_items) ? record.advantages_right_items : []),
        ].map((section: any) => ({
          title: section.title || "",
          content: section.content || section.description || "",
          ...section, // Preserve other fields
        }));

        setAdvantage({
          title: getAdvantagesTitle(record.advantages_title),
          desc: record.advantages_subtitle ?? "",
          sections: normalizedAdvantageSections,
        });

        setTalent({
          title: getHrGuideTitle(record.hr_guide_title),
          description: record.hr_guide_subtitle ?? "",
          desc: record.hr_guide_subtitle ?? "", // Keep both for compatibility
          points: record.hr_guide_steps ?? [],
        });

        setPageHeading(getDemoTitle(record.demo_title));
        // Handle demo_points as array of strings - load into dynamic array
        const pointsArray = Array.isArray(record.demo_points) ? record.demo_points : [];
        setDemoPoints(
          pointsArray.map((text: string, index: number) => ({
            id: `demo-point-${index}-${Date.now()}`,
            text: text || "",
          }))
        );
      } catch (e) {
        console.error("Failed to load corporate training data", e);
      } finally {
        if (mounted) {
          clearTimeout(timeout);
          if (showLoading) {
            setIsLoading(false);
          }
        }
      }
    })();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <main className="mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4 border border-gray-100">
        <h1 className="text-3xl font-semibold mb-8">Corporate Training</h1>

        {/* Loading Overlay - Only shows if loading takes more than 500ms */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 min-w-[300px]">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-[#1A3F66]/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#1A3F66] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-700 font-medium">Loading content...</p>
              <p className="text-sm text-gray-500">Please wait</p>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { id: "hero", label: "Hero Section" },
              { id: "empower", label: "Empower Workforce" },
              { id: "portfolio", label: "Portfolio" },
              { id: "advantage", label: "Advantage" },
              { id: "talent", label: "Talent Development" },
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

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          {/* Tab Content */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {activeTab === "hero" && (
              <div className="p-6">
        <HeroSection initial={hero} onChange={setHero} />
              </div>
            )}

            {activeTab === "empower" && (
              <div className="p-6">
        <EmpowerSection initial={empower} onChange={setEmpower} />
              </div>
            )}

            {activeTab === "portfolio" && (
              <div className="p-6">
        <PortfolioSection initial={portfolio} onChange={setPortfolio} />
              </div>
            )}

            {activeTab === "advantage" && (
              <div className="p-6">
        <AdvantageSection initial={advantage} onChange={setAdvantage} />
              </div>
            )}

            {activeTab === "talent" && (
              <div className="p-6">
  <TalentSection initial={talent} onChange={updateTalent} />
              </div>
            )}

            {activeTab === "demo" && (
              <div className="p-6 space-y-4">
          <AdminInput
            label="Demo Section Heading*"
            value={pageHeading}
            onChange={setPageHeading}
          />
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  This is the main heading displayed on the website (e.g., "Get A Live Free Demo")
                </p>
                
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
                      No demo points added yet. Click "Add Point" to add one.
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

          {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-4">
          <button
              type="submit"
              className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Submit"}
          </button>
        </div>
        </form>
      </div>
    </main>
  );
}



