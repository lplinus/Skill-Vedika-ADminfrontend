"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/utils/axios";
// FiUploadCloud not required here — BannerBox handles upload UI
import {
  AdminInput,
  AdminTextarea,
  BannerBox,
} from "../CorporateTraining/components/AdminUI";
import toast from "react-hot-toast";

export default function ContactPage() {
  // API proxy endpoint

  // --------------------------
  // HERO SECTION STATE (kept same names/styles)
  // --------------------------
  const [bannerHeading, setBannerHeading] = useState<string>("");
  const [bannerDescription, setBannerDescription] = useState<string>("");
  const [bannerImage, setBannerImage] = useState<string>("/default-uploads/Skill-vedika-Logo.jpg");
  // We now upload images via BannerBox -> cloud and store URL in `bannerImage`.
  const [bannerImageRemove, setBannerImageRemove] = useState<boolean>(false);

  const [buttonTitle, setButtonTitle] = useState<string>("");
  const [buttonTitleLink, setButtonTitleLink] = useState<string>("");
  const [heroSectionFooter, setHeroSectionFooter] = useState<string>("");
  const [subTitle, setSubTitle] = useState<string>("");

  // --------------------------
  // GET IN TOUCH SECTION
  // --------------------------
  const [touchHeading, setTouchHeading] = useState<string>("");

  // --------------------------
  // CONTACT DETAILS SECTION
  // --------------------------
  const [phoneLabel, setPhoneLabel] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const [emailLabel, setEmailLabel] = useState<string>("");
  const [emailID, setEmailID] = useState<string>("");

  const [location1Label, setLocation1Label] = useState<string>("");
  const [location1Address, setLocation1Address] = useState<string>("");

  const [visitOurGlobalOfficeTitle, setVisitOurGlobalOfficeTitle] = useState<string>("");
  const [visitOurGlobalOfficeContent, setVisitOurGlobalOfficeContent] = useState<string>("");

  const [locationLink1, setLocationLink1] = useState<string>("");
  const [locationLink2, setLocationLink2] = useState<string>("");

  const [location2Label, setLocation2Label] = useState<string>("");
  const [location2Address, setLocation2Address] = useState<string>("");

  const [pageHeading, setPageHeading] = useState<string>("");
  const [pageContent, setPageContent] = useState<string>("");

  const [demoPoints, setDemoPoints] = useState<{ id: string; title: string; description: string }[]>([]);

  // Loading / status
  const [saving, setSaving] = useState<boolean>(false);
  // Notifications are shown with react-hot-toast

  const [isNewRecord, setIsNewRecord] = useState<boolean>(true);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("hero");

  /* ----------------------------
     Load existing content from backend
     GET /api/contact-page
  ---------------------------- */
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get("/contact-page");
        const data = res.data;
        console.log("data", data);
        
        let body: unknown = null;
        try {
          body = data;
        } catch {
          body = { message: data.message };
        }
        if (!mounted) return;

        if (!mounted) return;

        // Type guard for body
        const bodyObj = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

        // Helper: Extract title from object or string
        const extractTitle = (title: unknown, fallback: string): string => {
          if (!title) return fallback;
          if (typeof title === "string") return title;
          const titleObj = title as { text?: string; part1?: string; part2?: string };
          return titleObj.text ?? (`${titleObj.part1 ?? ""} ${titleObj.part2 ?? ""}`.trim() || fallback);
        };

        // map backend fields to your frontend variables
        if (bodyObj.hero_title) {
          const ht = bodyObj.hero_title;
          setBannerHeading(extractTitle(ht, bannerHeading));
        }
        setBannerDescription((bodyObj.hero_description as string) ?? bannerDescription);
        setButtonTitle((bodyObj.hero_button as string) ?? buttonTitle);
        setButtonTitleLink((bodyObj.hero_button_link as string) ?? buttonTitleLink);
        setBannerImage((bodyObj.hero_image as string) ?? bannerImage);
        setHeroSectionFooter((bodyObj.contactus_target as string) ?? heroSectionFooter);
        setSubTitle((bodyObj.contactus_subtitle as string) ?? subTitle);

        if (bodyObj.contactus_title) {
          setTouchHeading(extractTitle(bodyObj.contactus_title, touchHeading));
        }
        setPhoneLabel((bodyObj.contacts_phone_label as string) ?? phoneLabel);
        setPhoneNumber((bodyObj.contacts_phone_number as string) ?? phoneNumber);
        setEmailLabel((bodyObj.contacts_email_label as string) ?? emailLabel);
        setEmailID((bodyObj.contacts_email_id as string) ?? emailID);
        setLocation1Label((bodyObj.contactus_location1_label as string) ?? location1Label);
        setLocation1Address((bodyObj.contactus_location1_address as string) ?? location1Address);
        setVisitOurGlobalOfficeTitle(extractTitle(bodyObj.map_title, visitOurGlobalOfficeTitle));
        setVisitOurGlobalOfficeContent((bodyObj.map_subtitle as string) ?? visitOurGlobalOfficeContent);
        setLocationLink1((bodyObj.map_link_india as string) ?? locationLink1);
        setLocationLink2((bodyObj.map_link as string) ?? locationLink2);
        setLocation2Label((bodyObj.contactus_location2_label as string) ?? location2Label);
        setLocation2Address((bodyObj.contactus_location2_address as string) ?? location2Address);
        setPageHeading(extractTitle(bodyObj.demo_title, pageHeading));
        setPageContent((bodyObj.demo_subtitle as string) ?? pageContent);
        if (Array.isArray(bodyObj.demo_points) && bodyObj.demo_points.length > 0) {
          const dp = bodyObj.demo_points as Array<{ title?: string; description?: string }>;
          setDemoPoints(
            dp.map((item, index) => ({
              id: `demo-point-${index}-${Date.now()}`,
              title: item.title ?? "",
              description: item.description ?? "",
            }))
          );
        } else {
          setDemoPoints([]);
        }
        setIsNewRecord(!bodyObj.id); // Track if this is a new record
      } catch (err: unknown) {
        console.error("Failed to load contact page:", err);
        toast.error("Failed to load contact page.");
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);


  const parseTitleParts = (value: string) => {
    if (!value) {
      return { text: "", part1: null, part2: null };
    }
  
    const words = value.trim().split(" ");
  
    // If only one word, no highlight
    if (words.length <= 1) {
      return {
        text: value.trim(),
        part1: value.trim(),
        part2: null,
      };
    }
  
    // Last word highlighted
    const part2 = words.pop() as string;
    const part1 = words.join(" ");
  
    return {
      text: `${part1} ${part2}`,
      part1,
      part2,
    };
  };
  
  /* ----------------------------
     Image upload handler using BannerBox (uploads to Cloudinary in BannerBox)
  ---------------------------- */
  // Banner uploads handled by BannerBox -> onUpload gives remote URL

  /* ----------------------------
     Submit handler (POST /api/contact-page/update)
     Uses FormData to allow image upload
  ---------------------------- */
  const handleSubmit = async () => {
  setSaving(true);

    // Build payload as JSON (route.js proxy expects JSON)
    const heroTitlePayload = parseTitleParts(bannerHeading);
    const contactusTitlePayload = parseTitleParts(touchHeading ?? "");
    const mapTitlePayload = parseTitleParts(visitOurGlobalOfficeTitle ?? "");
    const demoTitlePayload = parseTitleParts(pageHeading ?? "");
    const demoPointsPayload = demoPoints
      .filter((point) => point.title?.trim())
      .map((point) => ({
        title: point.title.trim(),
        description: point.description.trim() || "",
      }));

    const payload: any = {
      hero_title: heroTitlePayload,
      hero_description: bannerDescription ?? "",
      hero_button: buttonTitle ?? "",
      hero_button_link: buttonTitleLink ?? "",
      contactus_title: contactusTitlePayload,
      contactus_subtitle: subTitle ?? "",
      contacts_email_label: emailLabel ?? "",
      contacts_email_id: emailID ?? "",
      contacts_email_id_link: "",
      contacts_phone_label: phoneLabel ?? "",
      contacts_phone_number: phoneNumber ?? "",
      contacts_phone_number_link: "",
      contactus_location1_label: location1Label ?? "",
      contactus_location1_address: location1Address ?? "",
      contactus_location1_address_link: locationLink1 ?? "",
      contactus_location2_label: location2Label ?? "",
      contactus_location2_address: location2Address ?? "",
      contactus_location2_address_link: locationLink2 ?? "",
      map_title: mapTitlePayload,
      map_subtitle: visitOurGlobalOfficeContent ?? "",
      map_link_india: locationLink1 ?? "",
      map_link: locationLink2 ?? "",
      demo_title: demoTitlePayload,
      demo_subtitle: pageContent ?? "",
      demo_points: demoPointsPayload,
      contactus_target: heroSectionFooter ?? "",
      demo_target: "",
    };

    // If an image URL is available, send it as hero_image; if flagged to remove, send a remove flag
    if (bannerImageRemove) {
      payload.hero_image_remove = 1;
    } else if (bannerImage) {
      payload.hero_image = bannerImage;
    }

    try {
      // Send JSON and inspect raw response for debugging and correctness
      const res = await api.post("/contact-page", payload);

      const data = res.data;
      console.log("data", data);
      const text = data.text;
      console.log("POST /api/contact response status:", res.status, "body:", data);
      console.log("Response OK:", res.status === 201, "Status:", res.status);
      console.log("Full response:", data);

      // Check for error response
      if (res.status != 201) {
        // Helper: Extract error message from parsed response
        const getErrorMessage = (): string => {
          if (data && typeof data === "object") {
            const parsedObj = data as Record<string, unknown>;
            // Check for validation errors
            if ("errors" in parsedObj && typeof parsedObj.errors === "object") {
              const errors = parsedObj.errors as Record<string, unknown>;
              const errorMessages = Object.entries(errors)
                .map(([field, messages]) => {
                  const msgArray = Array.isArray(messages) ? messages : [messages];
                  return `${field}: ${msgArray.join(", ")}`;
                })
                .join("; ");
              return errorMessages || (typeof parsedObj.message === "string" ? parsedObj.message : "Validation failed");
            }
            if ("message" in parsedObj || "error" in parsedObj) {
              const message = parsedObj.message ?? parsedObj.error;
              return typeof message === "string" ? message : String(message);
            }
          }
          return text || `Status ${res.status}`;
        };
        const msg = getErrorMessage();
        console.error("Save failed:", msg);
        console.error("Full error response:", data);
        toast.error(msg);
        throw new Error(msg);
      }

      // Check if response indicates success
      const responseObj = data && typeof data === "object" ? data as Record<string, unknown> : null;
      const successMessage = responseObj?.message;
      console.log("Success message from backend:", successMessage);

      // success path - reload all data from backend to ensure UI matches
      const successMsg = isNewRecord ? "Contact Page Saved successfully." : "Contact Page Updated successfully.";
      console.log("Save successful, reloading data...");
      toast.success(successMsg);
      setIsNewRecord(false);

      // Force reload all data from backend to ensure UI matches
      try {
        console.log("Re-fetching data from backend...");
        const reloadRes = await api.get("/contact-page");
        const reloadData = reloadRes.data;
       
        console.log("Reloaded data:", reloadData);
        
        // Type guard for body
        const bodyObj = reloadData && typeof reloadData === "object" ? (reloadData as Record<string, unknown>) : {};
        
        // Reuse the existing extractTitle helper function
        const extractTitleForReload = (title: unknown): string => {
          if (!title) return "";
          if (typeof title === "string") return title;
          const titleObj = title as { text?: string; part1?: string; part2?: string };
          return titleObj.text ?? (`${titleObj.part1 ?? ""} ${titleObj.part2 ?? ""}`.trim() || "");
        };
        
        // Reload ALL fields from backend
        if (bodyObj.hero_title) {
          setBannerHeading(extractTitleForReload(bodyObj.hero_title));
        }
        setBannerDescription((bodyObj.hero_description as string) ?? "");
        setButtonTitle((bodyObj.hero_button as string) ?? "");
        setButtonTitleLink((bodyObj.hero_button_link as string) ?? "");
        setBannerImage((bodyObj.hero_image as string) ?? "/default-uploads/Skill-vedika-Logo.jpg");
        setHeroSectionFooter((bodyObj.contactus_target as string) ?? "");
        setSubTitle((bodyObj.contactus_subtitle as string) ?? "");
        
        if (bodyObj.contactus_title) {
          setTouchHeading(extractTitleForReload(bodyObj.contactus_title));
        }
        setPhoneLabel((bodyObj.contacts_phone_label as string) ?? "");
        setPhoneNumber((bodyObj.contacts_phone_number as string) ?? "");
        setEmailLabel((bodyObj.contacts_email_label as string) ?? "");
        setEmailID((bodyObj.contacts_email_id as string) ?? "");
        setLocation1Label((bodyObj.contactus_location1_label as string) ?? "");
        setLocation1Address((bodyObj.contactus_location1_address as string) ?? "");
        setVisitOurGlobalOfficeTitle(extractTitleForReload(bodyObj.map_title));
        setVisitOurGlobalOfficeContent((bodyObj.map_subtitle as string) ?? "");
        setLocationLink1((bodyObj.map_link_india as string) ?? "");
        setLocationLink2((bodyObj.map_link as string) ?? "");
        setLocation2Label((bodyObj.contactus_location2_label as string) ?? "");
        setLocation2Address((bodyObj.contactus_location2_address as string) ?? "");
        setPageHeading(extractTitleForReload(bodyObj.demo_title));
        setPageContent((bodyObj.demo_subtitle as string) ?? "");
        
        if (Array.isArray(bodyObj.demo_points) && bodyObj.demo_points.length > 0) {
          const dp = bodyObj.demo_points as Array<{ title?: string; description?: string }>;
          setDemoPoints(
            dp.map((item, index) => ({
              id: `demo-point-${index}-${Date.now()}`,
              title: item.title ?? "",
              description: item.description ?? "",
            }))
          );
        } else {
          setDemoPoints([]);
        }
        
        console.log("Data reloaded successfully");
      } catch (e) {
        console.error("Failed to re-fetch after save:", e);
        toast.error("Saved but failed to reload data. Please refresh the page.");
      }
    } catch (err: unknown) {
      let msg = "Failed to save content.";
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === "string") {
        msg = err;
      } else if (err !== null && err !== undefined) {
        // Safely convert error to string
        try {
          msg = JSON.stringify(err);
        } catch {
          if (typeof err === "string") {
            msg = err;
          } else if (err instanceof Error) {
            msg = err.message || "Unknown error";
          } else {
            msg = JSON.stringify(err, Object.getOwnPropertyNames(err));
          }
        }
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white p-8 rounded-2xl shadow-sm">
      {/* Header / status */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contact Page</h1>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-1 overflow-x-auto">
          {[
            { id: "hero", label: "Hero Section" },
            { id: "getInTouch", label: "Get In Touch" },
            { id: "contactDetails", label: "Contact Details" },
            { id: "globalOffice", label: "Global Office" },
            { id: "demo", label: "Live Free Demo" },
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
          <div className="p-6 space-y-5">

        <AdminInput label="Button Title*" value={buttonTitle} onChange={setButtonTitle} />

        <AdminInput label="Button Title Link (Optional)" value={buttonTitleLink} onChange={setButtonTitleLink} />

        {/* Banner Heading */}
        <div>
          <label htmlFor="banner-heading" className="text-gray-600 block mb-1 font-semibold">
            Heading*
          </label>
          <input
            id="banner-heading"
            value={bannerHeading}
            onChange={(e) => setBannerHeading(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: Simple text or "Text part1 Text part2" (If using parts, first part gets gradient styling on the website)
          </p>
        </div>

        {/* Banner Description */}
        <div>
          <label htmlFor="banner-description" className="text-gray-600 block mb-1 font-semibold">
            Description*
          </label>
          <textarea
            id="banner-description"
            rows={4}
            value={bannerDescription}
            onChange={(e) => setBannerDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
        </div>

        {/* Banner Image (uses Admin BannerBox which uploads to cloud) */}
        <div>
          <BannerBox
            label="Banner Image"
            image={bannerImage}
            onUpload={(url: string) => {
              setBannerImage(url);
              // bannerImageFile removed — BannerBox returns remote URLs
              setBannerImageRemove(false);
            }}
          />

          {bannerImage && (
            <div className="mt-2">
              <button
                onClick={() => {
                  setBannerImage("");
                  // bannerImageFile removed — BannerBox returns remote URLs
                  setBannerImageRemove(true);
                  toast("Banner image removed", { icon: "🗑️" });
                }}
                // className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded"
              >
                {/* Remove */}
              </button>
            </div>
          )}
        </div>
          </div>
        )}

        {activeTab === "getInTouch" && (
          <div className="p-6 space-y-5">

        <AdminInput label="Hero Section Footer*" value={heroSectionFooter} onChange={setHeroSectionFooter} />

        <div>
          <label htmlFor="section-heading" className="text-gray-600 font-semibold mb-1 block">
            Section Heading*
          </label>
          <input
            id="section-heading"
            value={touchHeading}
            onChange={(e) => setTouchHeading(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: Simple text or "Text part1 Text part2" (If using parts, first part gets gradient styling on the website)
          </p>
        </div>

        <AdminInput label="Sub Title*" value={subTitle} onChange={setSubTitle} />
          </div>
        )}

        {activeTab === "contactDetails" && (
          <div className="p-6 space-y-5">

        {/* PHONE + EMAIL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone Label */}
          <div>
            <label htmlFor="phone-label" className="text-gray-600 font-semibold mb-1 block">
              Phone Label*
            </label>
            <input
              id="phone-label"
              value={phoneLabel}
              onChange={(e) => setPhoneLabel(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            />
          </div>

          {/* Email Label */}
          <div>
            <label htmlFor="email-label" className="text-gray-600 font-semibold mb-1 block">
              Email Label*
            </label>
            <input
              id="email-label"
              value={emailLabel}
              onChange={(e) => setEmailLabel(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone-number" className="text-gray-600 font-semibold mb-1 block">
              Phone Number*
            </label>
            <input
              id="phone-number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            />
          </div>

          {/* Email ID */}
          <div>
            <label htmlFor="email-id" className="text-gray-600 font-semibold mb-1 block">
              Email ID*
            </label>
            <input
              id="email-id"
              value={emailID}
              onChange={(e) => setEmailID(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            />
          </div>
        </div>

        {/* LOCATION 1 */}
        <div>
          <label htmlFor="location1-label" className="text-gray-600 font-semibold mb-1 block">
            Location1 Label*
          </label>
          <input
            id="location1-label"
            value={location1Label}
            onChange={(e) => setLocation1Label(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
        </div>

        <div>
          <label htmlFor="location1-address" className="text-gray-600 font-semibold mb-1 block">
            Location1 Address*
          </label>
          <input
            id="location1-address"
            value={location1Address}
            onChange={(e) => setLocation1Address(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
        </div>

        {/* LOCATION 2 */}
        <div>
          <label htmlFor="location2-label" className="text-gray-600 font-semibold mb-1 block">
            Location2 Label*
          </label>
          <input
            id="location2-label"
            value={location2Label}
            onChange={(e) => setLocation2Label(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
        </div>

        <div>
          <label htmlFor="location2-address" className="text-gray-600 font-semibold mb-1 block">
            Location2 Address*
          </label>
          <input
            id="location2-address"
            value={location2Address}
            onChange={(e) => setLocation2Address(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300"
          />
        </div>
          </div>
        )}

        {activeTab === "globalOffice" && (
          <div className="p-6 space-y-4">
        <div>
        <AdminInput label="Title*" value={visitOurGlobalOfficeTitle} onChange={setVisitOurGlobalOfficeTitle} />
          <p className="text-xs text-gray-500 mt-1">
            Format: Simple text or "Text part1 Text part2" (If using parts, first part gets gradient styling on the website)
          </p>
        </div>

        <AdminTextarea label="Sub Title*" value={visitOurGlobalOfficeContent} onChange={setVisitOurGlobalOfficeContent} rows={4} />

        <AdminInput label="Google Map Embed Link1*" value={locationLink1} onChange={setLocationLink1} />

        <AdminInput label="Google Map Embed Link2*" value={locationLink2} onChange={setLocationLink2} />
          </div>
        )}

        {activeTab === "demo" && (
          <div className="p-6 space-y-4">
        <div>
        <AdminInput label="Demo Section Heading*" value={pageHeading ?? ""} onChange={setPageHeading} />
          <p className="text-xs text-gray-500 mt-1">
            Format: Simple text or "Text part1 Text part2" (If using parts, first part gets gradient styling on the website)
          </p>
        </div>
        <AdminTextarea label="Demo Content*" value={pageContent ?? ""} onChange={setPageContent} />

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
              No demo points added yet. Click "Add Point" to add one.
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

      {/* SUBMIT BUTTON */}
      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={saving} className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer shadow-sm">
          {saving ? "Saving..." : "Submit"}
        </button>
      </div>
    </section>
  );
}

