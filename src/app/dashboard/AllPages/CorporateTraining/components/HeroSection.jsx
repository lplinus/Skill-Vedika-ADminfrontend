"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AdminCard, AdminInput, AdminTextarea, BannerBox } from "./AdminUI";

const defaultTitle = "";
const defaultButtonName = "";
const defaultButtonLink = "";
const defaultDesc = "";
const defaultBanner = "";

export default function HeroSection({ initial, onChange }) {
  const isFirstRender = useRef(true);
  const prevInitialRef = useRef(null);
  const stateRef = useRef(null);
  
  // State combined to reduce multiple setState calls
  const [state, setState] = useState(() => ({
    title: initial?.title ?? defaultTitle,
    buttonName: initial?.buttonName ?? defaultButtonName,
    buttonLink: initial?.buttonLink ?? defaultButtonLink,
    desc: initial?.description ?? defaultDesc,
    banner: initial?.banner ?? defaultBanner,
  }));

  const { title, buttonName, buttonLink, desc, banner } = state;

  // keep a ref of the current state for synchronous comparisons in effects
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync local state whenever initial prop changes
  useEffect(() => {
    // Only update if initial data actually changed (by reference)
    if (initial && initial !== prevInitialRef.current && Object.keys(initial).length > 0) {
      prevInitialRef.current = initial;
      const newState = {
        title: initial.title ?? defaultTitle,
        buttonName: initial.buttonName ?? defaultButtonName,
        buttonLink: initial.buttonLink ?? defaultButtonLink,
        desc: initial.description ?? defaultDesc,
        banner: initial.banner ?? defaultBanner,
      };
      // If the derived state equals the current local state, skip any setState calls entirely
      try {
        if (JSON.stringify(stateRef.current) === JSON.stringify(newState)) {
          return;
        }
      } catch {
        // fall through to setState if compare fails
      }
      setState(newState);
    }
  }, [initial]);

  // Call onChange whenever state changes (but skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (onChange) {
      onChange({ title, description: desc, buttonName, buttonLink, banner });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, desc, buttonName, buttonLink, banner]);

  // Use useCallback to prevent re-renders when passed to child inputs
  const setTitle = useCallback((value) => setState((prev) => ({ ...prev, title: value })), []);
  const setButtonName = useCallback((value) => setState((prev) => ({ ...prev, buttonName: value })), []);
  const setButtonLink = useCallback((value) => setState((prev) => ({ ...prev, buttonLink: value })), []);
  const setDesc = useCallback((value) => setState((prev) => ({ ...prev, desc: value })), []);
  const setBanner = useCallback((value) => setState((prev) => ({ ...prev, banner: value })), []);

  return (
    <AdminCard title="Hero Section">
      <div>
      <AdminInput
        label="Page Title*"
        value={title}
        onChange={setTitle}
      />
        <p className="text-xs text-gray-500 mt-1">
          Format: "Skill Up with SkillVedika" (The word "SkillVedika" will appear highlighted in blue on the website)
        </p>
      </div>
      <AdminTextarea
        label="Page Description*"
        value={desc}
        onChange={setDesc}
        rows={5}
      />

      <AdminInput
        label="Button Name*"
        value={buttonName}
        onChange={setButtonName}
      />

      <AdminInput
        label="Button Link*"
        value={buttonLink}
        onChange={setButtonLink}
      />

      <BannerBox
        label="Select Banner Image"
        image={banner}
        onUpload={setBanner}
      />
    </AdminCard>
  );
}
