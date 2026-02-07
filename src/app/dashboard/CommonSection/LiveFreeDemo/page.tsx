"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { AdminCard, AdminInput } from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";

export default function LiveFreeDemoPage() {
  const [isSaving, setIsSaving] = useState(false);

  const [titlePart1, setTitlePart1] = useState("");
  const [titleHighlight, setTitleHighlight] = useState("");

  const [subtitleText, setSubtitleText] = useState("");

  const [nameLabel, setNameLabel] = useState("");
  const [emailLabel, setEmailLabel] = useState("");
  const [mobileLabel, setMobileLabel] = useState("");
  const [coursesLabel, setCoursesLabel] = useState("");
  const [termsLabel, setTermsLabel] = useState("");

  const [buttonText, setButtonText] = useState("");
  const [buttonIcon, setButtonIcon] = useState("");

  const [footerText, setFooterText] = useState("");

  // Load saved data on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/live-demo");
        if (!res.ok) {
          console.warn("Could not fetch saved live-demo settings", res.status);
          return;
        }
        const text = await res.text();
        let response;
        try {
          response = JSON.parse(text);
        } catch (err) {
          console.error("GET /api/live-demo returned non-JSON response:", text);
          return;
        }

        // Backend returns { data: {...} }, so unwrap it
        const data = response?.data;
        if (!data) {
          console.warn("No live-demo data from backend");
          return;
        }

        // Map backend fields to state
        if (data?.title) {
          setTitlePart1(data.title.part1 ?? "");
          setTitleHighlight(data.title.highlight ?? "");
        }
        if (data?.subtitle) {
          setSubtitleText(data.subtitle.text ?? "");
        }

        setNameLabel(data?.nameLabel ?? "");
        setEmailLabel(data?.emailLabel ?? "");
        setMobileLabel(data?.mobileLabel ?? "");
        setCoursesLabel(data?.selectCoursesLabel ?? "");
        setTermsLabel(data?.termsLabel ?? "");

        if (data?.buttonLabel) {
          setButtonText(data.buttonLabel.text ?? "");
          setButtonIcon(data.buttonLabel.icon ?? "");
        }

        setFooterText(data?.footerText ?? "");
      } catch (err: unknown) {
        console.error("Failed to load live-demo settings:", err);
      }
    }

    load();
  }, []);

  const handleSubmit = async () => {
    setIsSaving(true);

    const payload = {
      title: {
        part1: titlePart1 ?? "",
        highlight: titleHighlight ?? "",
      },
      subtitle: {
        text: subtitleText ?? "",
      },

      nameLabel: nameLabel ?? "",
      emailLabel: emailLabel ?? "",
      mobileLabel: mobileLabel ?? "",
      selectCoursesLabel: coursesLabel ?? "",
      termsLabel: termsLabel ?? "",

      buttonLabel: {
        text: buttonText ?? "",
        icon: buttonIcon ?? "",
      },

      footerText: footerText ?? "",
    };

    try {
      const res = await fetch("/api/live-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      console.debug("POST /api/live-demo response status:", res.status, "body:", data ?? text);

      if (!res.ok) {
        const dataObj = data && typeof data === "object" ? (data as Record<string, unknown>) : undefined;
        const msg = dataObj && ("message" in dataObj || "error" in dataObj)
          ? String(dataObj["message"] ?? dataObj["error"])
          : text || `Status ${res.status}`;
        toast.error(String(msg));
        throw new Error(String(msg));
      }

      // success path
      toast.success("Saved successfully.");

      // re-fetch fresh data to ensure UI matches backend
      try {
        const body = await fetch("/api/live-demo").then(r => r.text()).then(t => {
          try {
            return JSON.parse(t);
          } catch {
            return null;
          }
        });

        // Unwrap { data: {...} } structure
        const data = body?.data;
        if (data) {
          if (data?.title) {
            setTitlePart1(data.title.part1 ?? "");
            setTitleHighlight(data.title.highlight ?? "");
          }
          if (data?.subtitle) {
            setSubtitleText(data.subtitle.text ?? "");
          }
          setNameLabel(data?.nameLabel ?? "");
          setEmailLabel(data?.emailLabel ?? "");
          setMobileLabel(data?.mobileLabel ?? "");
          setCoursesLabel(data?.selectCoursesLabel ?? "");
          setTermsLabel(data?.termsLabel ?? "");
          if (data?.buttonLabel) {
            setButtonText(data.buttonLabel.text ?? "");
            setButtonIcon(data.buttonLabel.icon ?? "");
          }
          setFooterText(data?.footerText ?? "");
        }
      } catch (e: unknown) {
        console.debug("Failed to re-fetch after save:", e);
      }
    } catch (err: unknown) {
      let msg = "Failed to save settings.";
      if (err instanceof Error) msg = err.message;
      else if (typeof err === "string") msg = err;
      else msg = String(err ?? msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Live Free Demo Settings</h1>

      <AdminCard title="Title Settings">
        <AdminInput label="Title Part 1" value={titlePart1} onChange={setTitlePart1} />
        <AdminInput label="Title Highlight" value={titleHighlight} onChange={setTitleHighlight} />
        <AdminInput label="Subtitle" value={subtitleText} onChange={setSubtitleText} />
      </AdminCard>

      <AdminCard title="Form Field Labels">
        <AdminInput label="Name Label" value={nameLabel} onChange={setNameLabel} />
        <AdminInput label="Email Label" value={emailLabel} onChange={setEmailLabel} />
        <AdminInput label="Mobile Label" value={mobileLabel} onChange={setMobileLabel} />
        <AdminInput label="Select Courses Label" value={coursesLabel} onChange={setCoursesLabel} />
        <AdminInput label="Terms Label" value={termsLabel} onChange={setTermsLabel} />
      </AdminCard>

      <AdminCard title="Button Settings">
        <AdminInput label="Button Text" value={buttonText} onChange={setButtonText} />
        <AdminInput label="Button Icon (optional)" value={buttonIcon} onChange={setButtonIcon} />
      </AdminCard>

      <AdminCard title="Footer">
        <AdminInput label="Footer Text" value={footerText} onChange={setFooterText} />
      </AdminCard>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-3 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
