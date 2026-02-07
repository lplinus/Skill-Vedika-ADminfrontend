"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  AdminInput,
  AdminTextarea,
  BannerBox,
} from "../CorporateTraining/components/AdminUI";
import { api } from "@/utils/axios";

export default function HomepageDetailsPage() {
  const [isSaving, setIsSaving] = useState(false);

  /* ========================= STATES ========================= */

  // HERO
  const [heroHeading, setHeroHeading] = useState("");
  const [heroContent, setHeroContent] = useState("");
  const [popularContent, setPopularContent] = useState("");
  const [heroBanner, setHeroBanner] = useState("");

  // EXPLORE
  const [homeSectionHeading, setHomeSectionHeading] = useState("");
  const [homeSectionContent, setHomeSectionContent] = useState("");
  const [exploreTabs, setExploreTabs] = useState(["Trending", "Popular", "Free"]);

  // KEY FEATURES
  const [getStartedHeading, setGetStartedHeading] = useState("");
  const [keyFeaturedContent, setKeyFeaturedContent] = useState("");
  const [featuredPoint1, setFeaturedPoint1] = useState("");
  const [featuredPoint2, setFeaturedPoint2] = useState("");
  const [featuredPoint3, setFeaturedPoint3] = useState("");
  const [featuredPoint4, setFeaturedPoint4] = useState("");

  // JOB ASSISTANCE
  const [jobAssistanceHeading, setJobAssistanceHeading] = useState("");
  const [jobAssistanceContent, setJobAssistanceContent] = useState("");

  const [job1Title, setJob1Title] = useState("");
  const [job1Content, setJob1Content] = useState("");

  const [job2Title, setJob2Title] = useState("");
  const [job2Content, setJob2Content] = useState("");

  const [job3Title, setJob3Title] = useState("");
  const [job3Content, setJob3Content] = useState("");

  const [job4Title, setJob4Title] = useState("");
  const [job4Content, setJob4Content] = useState("");

  const [job5Title, setJob5Title] = useState("");
  const [job5Content, setJob5Content] = useState("");

  const [job6Title, setJob6Title] = useState("");
  const [job6Content, setJob6Content] = useState("");

  // JOB SUPPORT
  const [jobSupportTitle, setJobSupportTitle] = useState("");
  const [jobSupportContent, setJobSupportContent] = useState("");
  const [payment1, setPayment1] = useState("Hourly");
  const [payment2, setPayment2] = useState("Weekly");
  const [payment3, setPayment3] = useState("Monthly");
  const [buttonHeading, setButtonHeading] = useState("");
  const [buttonLink, setButtonLink] = useState("");

  // BLOG
  const [blogHeading, setBlogHeading] = useState("");

  // Detects whether this is a NEW record
  const [isNewRecord, setIsNewRecord] = useState(true);
  const [homepageId, setHomepageId] = useState<number | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("hero");

  /* ========================= FETCH EXISTING DATA ========================= */
  
useEffect(() => {
  const loadHomepage = async () => {
    try {
      const res = await api.get("/homepage", {
        withCredentials: true,
      });

      const data = res.data;
      if (!data) return;

      /* ================= HERO ================= */
      setHeroHeading(data.hero_heading || "");
      setHeroContent(data.hero_content?.join("\n") || "");
      setPopularContent(data.hero_popular?.join("\n") || "");
      setHeroBanner(data.hero_image || "");

      /* ================= EXPLORE ================= */
      setHomeSectionHeading(data.explore_heading || "");
      setHomeSectionContent(data.explore_content || "");
      setExploreTabs(data.explore_tabs || ["Trending", "Popular", "Free"]);

      /* ================= KEY FEATURES ================= */
      setGetStartedHeading(data.key_features_title || "");
      setKeyFeaturedContent(data.key_features_content || "");

      if (Array.isArray(data.key_features_points)) {
        setFeaturedPoint1(data.key_features_points[0] || "");
        setFeaturedPoint2(data.key_features_points[1] || "");
        setFeaturedPoint3(data.key_features_points[2] || "");
        setFeaturedPoint4(data.key_features_points[3] || "");
      }

      /* ================= JOB ASSISTANCE ================= */
      setJobAssistanceHeading(data.job_assistance_heading || "");
      setJobAssistanceContent(data.job_assistance_content || "");

      if (Array.isArray(data.job_assistance_points)) {
        setJob1Title(data.job_assistance_points[0]?.title || "");
        setJob1Content(data.job_assistance_points[0]?.desc || "");

        setJob2Title(data.job_assistance_points[1]?.title || "");
        setJob2Content(data.job_assistance_points[1]?.desc || "");

        setJob3Title(data.job_assistance_points[2]?.title || "");
        setJob3Content(data.job_assistance_points[2]?.desc || "");

        setJob4Title(data.job_assistance_points[3]?.title || "");
        setJob4Content(data.job_assistance_points[3]?.desc || "");

        setJob5Title(data.job_assistance_points[4]?.title || "");
        setJob5Content(data.job_assistance_points[4]?.desc || "");

        setJob6Title(data.job_assistance_points[5]?.title || "");
        setJob6Content(data.job_assistance_points[5]?.desc || "");
      }

      /* ================= JOB SUPPORT ================= */
      setJobSupportTitle(data.job_support_title || "");
      setJobSupportContent(data.job_support_content || "");

      if (Array.isArray(data.job_support_payment_types)) {
        setPayment1(data.job_support_payment_types[0] || "");
        setPayment2(data.job_support_payment_types[1] || "");
        setPayment3(data.job_support_payment_types[2] || "");
      }

      setButtonHeading(data.job_support_button || "");
      setButtonLink(data.job_support_button_link || "");

      /* ================= BLOG ================= */
      setBlogHeading(data.blog_section_heading || "");

      /* ================= RECORD META ================= */
      setIsNewRecord(!data?.id);
      setHomepageId(data?.id || null);
    } catch (error: any) {
      console.error("Failed to load homepage data:", error);
      toast.error("Failed to load homepage data");
    }
  };

  loadHomepage();
}, []);
  /* ========================= SAVE HOMEPAGE ========================= */

  async function saveHomepage() {
    setIsSaving(true);

    const payload = {
      hero_heading: heroHeading,
      hero_content: heroContent.split("\n").filter(Boolean),
      hero_popular: popularContent.split("\n").filter(Boolean),
      hero_image: heroBanner,

      explore_heading: homeSectionHeading,
      explore_content: homeSectionContent,
      explore_tabs: exploreTabs,

      key_features_title: getStartedHeading,
      key_features_content: keyFeaturedContent,
      key_features_points: [
        featuredPoint1,
        featuredPoint2,
        featuredPoint3,
        featuredPoint4,
      ],

      job_assistance_heading: jobAssistanceHeading,
      job_assistance_content: jobAssistanceContent,
      job_assistance_points: [
        { title: job1Title, desc: job1Content, content: job1Content }, // Save both for compatibility
        { title: job2Title, desc: job2Content, content: job2Content },
        { title: job3Title, desc: job3Content, content: job3Content },
        { title: job4Title, desc: job4Content, content: job4Content },
        { title: job5Title, desc: job5Content, content: job5Content },
        { title: job6Title, desc: job6Content, content: job6Content },
      ],

      job_support_title: jobSupportTitle,
      job_support_content: jobSupportContent,
      job_support_payment_types: [payment1, payment2, payment3],
      job_support_button: buttonHeading,
      job_support_button_link: buttonLink,

      blog_section_heading: blogHeading,
    };

    try {
      const url = isNewRecord ? `/homepage` : `/homepage/${homepageId}`;
 let res;
      if(isNewRecord){
        res = await api.post(url, payload);
      } else {
        res = await api.put(url, payload);
      }

      const result = res.data;
      setIsSaving(false);

      if (res.status === 200) {
        if (isNewRecord) {
          toast.success("Homepage Saved Successfully!", {
            duration: 3000,
            position: "top-right",
          });
          setIsNewRecord(false);
          setHomepageId(result?.id || null);
        } else {
          toast.success("Homepage Updated Successfully!", {
            duration: 3000,
            position: "top-right",
          });
        }
      } else {
        toast.error(res.data.message || "Failed to save homepage.", {
          duration: 4000,
          position: "top-right",
        });
      }
    } catch (error) {
      setIsSaving(false);
      console.error("Error saving homepage:", error);
      toast.error("An error occurred while saving. Please try again.", {
        duration: 4000,
        position: "top-right",
      });
    }
  }


  /* ========================= UI ========================= */

  return (
    <section className="bg-white p-8 rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Homepage Details
      </h1>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-1 overflow-x-auto">
          {[
            { id: "hero", label: "Hero Section" },
            { id: "explore", label: "Explore Section" },
            { id: "keyFeatures", label: "Key Features" },
            { id: "jobAssistance", label: "Job Assistance" },
            { id: "jobSupport", label: "Job Support" },
            { id: "blog", label: "Blog Section" },
          ].map((tab) => (
            <button
              key={tab.id}
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

      {/* Tab Content */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {activeTab === "hero" && (
          <div className="p-6">
              <div>
                <AdminInput label="Heading" value={heroHeading} onChange={setHeroHeading} />
                <p className="text-xs text-gray-500 mt-1">
                  Format: HTML format with tags like &quot;Text <span>Highlighted</span> Text&quot; (Text inside &lt;span&gt; tags will appear highlighted on the website)
                </p>
              </div>
              <AdminTextarea label="Content (multi-line)" value={heroContent} onChange={setHeroContent} />
              <AdminTextarea label="Popular Content (multi-line)" value={popularContent} onChange={setPopularContent} />

              <BannerBox
                label="Hero Banner"
                image={heroBanner}
                onUpload={(url) => {
                  setHeroBanner(url);
                }}
              />
            </div>
        )}

        {activeTab === "explore" && (
          <div className="p-6 space-y-6">
              <AdminInput label="Heading" value={homeSectionHeading} onChange={setHomeSectionHeading} />
              <AdminTextarea label="Content" value={homeSectionContent} onChange={setHomeSectionContent} />

              {/* Tabs Section */}
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#1A3F66] rounded" aria-hidden="true"></span>
                  <span>Explore Tabs</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {exploreTabs.map((tab, i) => {
                    let exampleText = "e.g., Free";
                    if (i === 0) {
                      exampleText = "e.g., Trending";
                    } else if (i === 1) {
                      exampleText = "e.g., Popular";
                    }
                    return (
                    <div key={`explore-tab-${i}`} className="space-y-2">
                      <label htmlFor={`explore-tab-${i}`} className="block text-sm font-medium text-gray-700">
                        Tab {i + 1} <span className="text-gray-400">({exampleText})</span>
                      </label>
                      <input
                        id={`explore-tab-${i}`}
                        type="text"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                        value={exploreTabs[i]}
                        onChange={(e) => {
                          const updated = [...exploreTabs];
                          updated[i] = e.target.value;
                          setExploreTabs(updated);
                        }}
                        placeholder={`Enter tab ${i + 1} name`}
                      />
                    </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  These tabs will be displayed in the explore section on the homepage.
                </p>
              </div>
            </div>
        )}

        {activeTab === "keyFeatures" && (
          <div className="p-6 space-y-6">
              <AdminInput label="Heading" value={getStartedHeading} onChange={setGetStartedHeading} />
              <AdminTextarea label="Content" value={keyFeaturedContent} onChange={setKeyFeaturedContent} />

              {/* Features Section */}
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#1A3F66] rounded" aria-hidden="true"></span>
                  <span>Key Features</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="feature-1" className="block text-sm font-medium text-gray-700">
                      Feature 1 <span className="text-gray-400">(e.g., Industry standard curriculum)</span>
                    </label>
                    <input
                      id="feature-1"
                      type="text"
                      value={featuredPoint1}
                      onChange={(e) => setFeaturedPoint1(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter feature 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="feature-2" className="block text-sm font-medium text-gray-700">
                      Feature 2 <span className="text-gray-400">(e.g., Official certification guidance)</span>
                    </label>
                    <input
                      id="feature-2"
                      type="text"
                      value={featuredPoint2}
                      onChange={(e) => setFeaturedPoint2(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter feature 2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="feature-3" className="block text-sm font-medium text-gray-700">
                      Feature 3 <span className="text-gray-400">(e.g., Flexible schedules)</span>
                    </label>
                    <input
                      id="feature-3"
                      type="text"
                      value={featuredPoint3}
                      onChange={(e) => setFeaturedPoint3(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter feature 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="feature-4" className="block text-sm font-medium text-gray-700">
                      Feature 4 <span className="text-gray-400">(e.g., Real world projects)</span>
                    </label>
                    <input
                      id="feature-4"
                      type="text"
                      value={featuredPoint4}
                      onChange={(e) => setFeaturedPoint4(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter feature 4"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  These features will be displayed in the key features section on the homepage.
                </p>
              </div>
            </div>
        )}

        {activeTab === "jobAssistance" && (
          <div className="p-6 space-y-6">
              <AdminInput label="Heading" value={jobAssistanceHeading} onChange={setJobAssistanceHeading} />
              <AdminTextarea label="Content" value={jobAssistanceContent} onChange={setJobAssistanceContent} />

              {/* Job Assistance Points Section */}
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#1A3F66] rounded" aria-hidden="true"></span>
                  <span>Job Assistance Points</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                    <label htmlFor="job-1-title" className="block text-sm font-medium text-gray-700">
                      Job 1 Title <span className="text-gray-400">(e.g., Course Completion)</span>
                    </label>
                    <input
                      id="job-1-title"
                      type="text"
                      value={job1Title}
                      onChange={(e) => setJob1Title(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter job 1 title"
                    />
                    <label htmlFor="job-1-content" className="block text-sm font-medium text-gray-700">
                      Job 1 Content
                    </label>
                    <textarea
                      id="job-1-content"
                      value={job1Content}
                      onChange={(e) => setJob1Content(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white resize-y min-h-[80px]"
                      placeholder="Enter job 1 content"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                    <label htmlFor="job-2-title" className="block text-sm font-medium text-gray-700">
                      Job 2 Title <span className="text-gray-400">(e.g., Quizzes)</span>
                    </label>
                    <input
                      id="job-2-title"
                      type="text"
                      value={job2Title}
                      onChange={(e) => setJob2Title(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter job 2 title"
                    />
                    <label htmlFor="job-2-content" className="block text-sm font-medium text-gray-700">
                      Job 2 Content
                    </label>
                    <textarea
                      id="job-2-content"
                      value={job2Content}
                      onChange={(e) => setJob2Content(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white resize-y min-h-[80px]"
                      placeholder="Enter job 2 content"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                    <label htmlFor="job-3-title" className="block text-sm font-medium text-gray-700">
                      Job 3 Title <span className="text-gray-400">(e.g., Mock interviews)</span>
                    </label>
                    <input
                      id="job-3-title"
                      type="text"
                      value={job3Title}
                      onChange={(e) => setJob3Title(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter job 3 title"
                    />
                    <label htmlFor="job-3-content" className="block text-sm font-medium text-gray-700">
                      Job 3 Content
                    </label>
                    <textarea
                      id="job-3-content"
                      value={job3Content}
                      onChange={(e) => setJob3Content(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white resize-y min-h-[80px]"
                      placeholder="Enter job 3 content"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                    <label htmlFor="job-4-title" className="block text-sm font-medium text-gray-700">
                      Job 4 Title <span className="text-gray-400">(e.g., Resume building)</span>
                    </label>
                    <input
                      id="job-4-title"
                      type="text"
                      value={job4Title}
                      onChange={(e) => setJob4Title(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter job 4 title"
                    />
                    <label htmlFor="job-4-content" className="block text-sm font-medium text-gray-700">
                      Job 4 Content
                    </label>
                    <textarea
                      id="job-4-content"
                      value={job4Content}
                      onChange={(e) => setJob4Content(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white resize-y min-h-[80px]"
                      placeholder="Enter job 4 content"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                    <label htmlFor="job-5-title" className="block text-sm font-medium text-gray-700">
                      Job 5 Title <span className="text-gray-400">(e.g., Rating)</span>
                    </label>
                    <input
                      id="job-5-title"
                      type="text"
                      value={job5Title}
                      onChange={(e) => setJob5Title(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter job 5 title"
                    />
                    <label htmlFor="job-5-content" className="block text-sm font-medium text-gray-700">
                      Job 5 Content
                    </label>
                    <textarea
                      id="job-5-content"
                      value={job5Content}
                      onChange={(e) => setJob5Content(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white resize-y min-h-[80px]"
                      placeholder="Enter job 5 content"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                    <label htmlFor="job-6-title" className="block text-sm font-medium text-gray-700">
                      Job 6 Title <span className="text-gray-400">(e.g., Profile marketing)</span>
                    </label>
                    <input
                      id="job-6-title"
                      type="text"
                      value={job6Title}
                      onChange={(e) => setJob6Title(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter job 6 title"
                    />
                    <label htmlFor="job-6-content" className="block text-sm font-medium text-gray-700">
                      Job 6 Content
                    </label>
                    <textarea
                      id="job-6-content"
                      value={job6Content}
                      onChange={(e) => setJob6Content(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white resize-y min-h-[80px]"
                      placeholder="Enter job 6 content"
                      rows={3}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  These job assistance points will be displayed in the job assistance program section on the homepage.
                </p>
              </div>
            </div>
        )}

        {activeTab === "jobSupport" && (
          <div className="p-6 space-y-6">
              <AdminInput label="Title" value={jobSupportTitle} onChange={setJobSupportTitle} />
              <AdminTextarea label="Content" value={jobSupportContent} onChange={setJobSupportContent} />

              {/* Payment Types Section */}
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#1A3F66] rounded" aria-hidden="true"></span>
                  <span>Payment Types</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="payment-type-1" className="block text-sm font-medium text-gray-700">
                      Payment Type 1 <span className="text-gray-400">(e.g., Hourly)</span>
                    </label>
                    <input
                      id="payment-type-1"
                      type="text"
                      value={payment1}
                      onChange={(e) => setPayment1(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter payment type"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="payment-type-2" className="block text-sm font-medium text-gray-700">
                      Payment Type 2 <span className="text-gray-400">(e.g., Weekly)</span>
                    </label>
                    <input
                      id="payment-type-2"
                      type="text"
                      value={payment2}
                      onChange={(e) => setPayment2(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter payment type"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="payment-type-3" className="block text-sm font-medium text-gray-700">
                      Payment Type 3 <span className="text-gray-400">(e.g., Monthly)</span>
                    </label>
                    <input
                      id="payment-type-3"
                      type="text"
                      value={payment3}
                      onChange={(e) => setPayment3(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-300 focus:border-gray-300 transition-all bg-white"
                      placeholder="Enter payment type"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  These payment types will be displayed on the homepage job support section.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AdminInput label="Button Heading" value={buttonHeading} onChange={setButtonHeading} />
                <AdminInput label="Button Link" value={buttonLink} onChange={setButtonLink} />
              </div>
            </div>
        )}

        {activeTab === "blog" && (
          <div className="p-6">
            <AdminInput label="Blog Heading" value={blogHeading} onChange={setBlogHeading} />
          </div>
        )}
      </div>

      {/* SUBMIT */}
      <div className="flex justify-end mt-6">
        <button
          onClick={saveHomepage}
          className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer shadow-sm"
        >
          {isSaving ? "Saving..." : "Submit"}
        </button>
      </div>
    </section>
  );
}
