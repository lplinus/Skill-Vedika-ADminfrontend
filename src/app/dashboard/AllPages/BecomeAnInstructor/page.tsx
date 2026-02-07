"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { AdminCard, AdminInput, AdminTextarea, BannerBox } from "../CorporateTraining/components/AdminUI";
import { api } from "@/utils/axios";

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon?: string;
  highlighted?: boolean;
}

export default function BecomeInstructorPage() {
  // Hero Section
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroButtonText, setHeroButtonText] = useState("");
  const [heroImage, setHeroImage] = useState("");

  // Benefits Section
  const [benefitsTitle, setBenefitsTitle] = useState("");
  const [benefitsSubtitle, setBenefitsSubtitle] = useState("");
  const [benefits, setBenefits] = useState<Benefit[]>([]);

  // CTA Section
  const [ctaTitle, setCtaTitle] = useState("");
  const [ctaDescription, setCtaDescription] = useState("");
  const [ctaButtonText, setCtaButtonText] = useState("");

  // Form Section
  const [formTitle, setFormTitle] = useState("");

  // Legacy fields (for backward compatibility)
  const [heading, setHeading] = useState("");
  const [content, setContent] = useState("");
  const [banner, setBanner] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* --------------------------------
     LOAD CONTENT ON MOUNT
  -------------------------------- */
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/become-instructor");
        
        if (res.status === 200 && res.data?.data) {
          const data = res.data.data;
          
          // Hero Section
          setHeroTitle(data.hero_title || "");
          setHeroDescription(data.hero_description || "");
          setHeroButtonText(data.hero_button_text || "");
          setHeroImage(data.hero_image || "");
          
          // Benefits Section
          setBenefitsTitle(data.benefits_title || "");
          setBenefitsSubtitle(data.benefits_subtitle || "");
          setBenefits(Array.isArray(data.benefits) ? data.benefits.map((b: any, i: number) => ({
            id: b.id || `benefit-${i}`,
            title: b.title || "",
            description: b.description || "",
            icon: b.icon || "",
            highlighted: b.highlighted || false,
          })) : []);
          
          // CTA Section
          setCtaTitle(data.cta_title || "");
          setCtaDescription(data.cta_description || "");
          setCtaButtonText(data.cta_button_text || "");
          
          // Form Section
          setFormTitle(data.form_title || "");
          
          // Legacy fields
          setHeading(data.heading || "");
          setContent(data.content || "");
          setBanner(data.banner || "");
        }
      } catch (err: any) {
        console.error("Failed to load content:", err);
        if (err?.response?.status !== 404) {
          toast.error("Failed to load content");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  /* --------------------------------
     BENEFITS MANAGEMENT
  -------------------------------- */
  const addBenefit = () => {
    setBenefits([...benefits, {
      id: `benefit-${Date.now()}`,
      title: "",
      description: "",
      icon: "",
      highlighted: false,
    }]);
  };

  const updateBenefit = (index: number, field: keyof Benefit, value: any) => {
    const newBenefits = [...benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setBenefits(newBenefits);
  };

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index));
  };

  /* --------------------------------
     SAVE HANDLER
  -------------------------------- */
  const handleSubmit = async () => {
    if (isSaving) return;

    // Validation
    if (!heroTitle.trim()) {
      toast.error("Hero Title is required");
      return;
    }
    if (!heroDescription.trim()) {
      toast.error("Hero Description is required");
      return;
    }
    if (!benefitsTitle.trim()) {
      toast.error("Benefits Title is required");
      return;
    }
    if (benefits.length === 0) {
      toast.error("At least one benefit is required");
      return;
    }
    if (benefits.some(b => !b.title.trim() || !b.description.trim())) {
      toast.error("All benefits must have title and description");
      return;
    }
    if (!ctaTitle.trim()) {
      toast.error("CTA Title is required");
      return;
    }
    if (!formTitle.trim()) {
      toast.error("Form Title is required");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        // Hero Section
        hero_title: heroTitle.trim(),
        hero_description: heroDescription.trim(),
        hero_button_text: heroButtonText.trim() || "Apply Now",
        hero_image: heroImage || null,
        
        // Benefits Section
        benefits_title: benefitsTitle.trim(),
        benefits_subtitle: benefitsSubtitle.trim(),
        benefits: benefits.map(({ id, ...rest }) => rest), // Remove id before sending
        
        // CTA Section
        cta_title: ctaTitle.trim(),
        cta_description: ctaDescription.trim(),
        cta_button_text: ctaButtonText.trim() || "Apply Now — It Takes Less Than 2 Minutes",
        
        // Form Section
        form_title: formTitle.trim(),
        
        // Legacy fields (for backward compatibility)
        heading: heading.trim() || heroTitle.trim(),
        content: content.trim() || heroDescription.trim(),
        banner: banner || heroImage || null,
      };

      const res = await api.post("/become-instructor", payload);

      if (res.status === 201) {
        toast.success("Content saved successfully!");
      } else {
        toast.error("Failed to save content");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      
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

  if (isLoading) {
    return (
      <section className="bg-white p-8 rounded-2xl shadow-sm" style={{ border: "1px solid rgba(16, 24, 40, 0.08)" }}>
        <div className="text-center py-10">
          <p className="text-gray-500">Loading content...</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-white p-8 rounded-2xl shadow-sm"
      style={{ border: "1px solid rgba(16, 24, 40, 0.08)" }}
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Become An Instructor Page
      </h1>

      <div className="space-y-10">
        {/* HERO SECTION */}
        <AdminCard title="Hero Section">
          <AdminInput
            label="Hero Title*"
            value={heroTitle}
            onChange={setHeroTitle}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Main heading for the hero section (e.g., &quot;Become an Instructor at SkillVedika&quot;)
          </p>

          <AdminTextarea
            label="Hero Description*"
            value={heroDescription}
            onChange={setHeroDescription}
            rows={3}
            required
          />

          <AdminInput
            label="Hero Button Text"
            value={heroButtonText}
            onChange={setHeroButtonText}
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: &quot;Apply Now&quot;
          </p>

          <BannerBox
            label="Hero Image"
            image={heroImage}
            onUpload={setHeroImage}
          />
        </AdminCard>

        {/* BENEFITS SECTION */}
        <AdminCard title="Benefits Section">
          <AdminInput
            label="Benefits Title*"
            value={benefitsTitle}
            onChange={setBenefitsTitle}
            required
          />

          <AdminTextarea
            label="Benefits Subtitle"
            value={benefitsSubtitle}
            onChange={setBenefitsSubtitle}
            rows={2}
          />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-700">Benefits</h3>
              <button
                type="button"
                onClick={addBenefit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                + Add Benefit
              </button>
            </div>

            {benefits.map((benefit, index) => (
              <div
                key={benefit.id}
                className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Benefit {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
                  >
                    Remove
                  </button>
                </div>

                <AdminInput
                  label="Title*"
                  value={benefit.title}
                  onChange={(v) => updateBenefit(index, "title", v)}
                  required
                />

                <AdminTextarea
                  label="Description*"
                  value={benefit.description}
                  onChange={(v) => updateBenefit(index, "description", v)}
                  rows={3}
                  required
                />

                <AdminInput
                  label="Icon Name (Optional)"
                  value={benefit.icon || ""}
                  onChange={(v) => updateBenefit(index, "icon", v)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lucide icon name (e.g., &quot;DollarSign&quot;, &quot;Users&quot;, &quot;Calendar&quot;)
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`highlighted-${index}`}
                    checked={benefit.highlighted || false}
                    onChange={(e) => updateBenefit(index, "highlighted", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`highlighted-${index}`} className="text-sm text-gray-600">
                    Highlight this benefit (shows &quot;Popular&quot; badge)
                  </label>
                </div>
              </div>
            ))}

            {benefits.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No benefits added yet. Click &quot;Add Benefit&quot; to create the first one.
              </p>
            )}
          </div>
        </AdminCard>

        {/* CTA SECTION */}
        <AdminCard title="CTA Section">
          <AdminInput
            label="CTA Title*"
            value={ctaTitle}
            onChange={setCtaTitle}
            required
          />

          <AdminTextarea
            label="CTA Description*"
            value={ctaDescription}
            onChange={setCtaDescription}
            rows={3}
            required
          />

          <AdminInput
            label="CTA Button Text"
            value={ctaButtonText}
            onChange={setCtaButtonText}
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: &quot;Apply Now — It Takes Less Than 2 Minutes&quot;
          </p>
        </AdminCard>

        {/* FORM SECTION */}
        <AdminCard title="Form Section">
          <AdminInput
            label="Form Section Title*"
            value={formTitle}
            onChange={setFormTitle}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Title displayed above the instructor application form
          </p>
        </AdminCard>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSaving ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </section>
  );
}
