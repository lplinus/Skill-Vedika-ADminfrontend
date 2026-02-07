"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AdminCard, AdminInput, BannerBox } from "./AdminUI";
import dynamic from "next/dynamic";
import TipTapEditor from "./TipTapEditor";

// // ⭐ Load your TipTapEditor exactly as required
// const TipTapEditor = dynamic(
//   () =>
//     import("@/components/editor/RichTextEditor").then(
//       (mod) => mod.RichTextEditor
//     ),
//   { ssr: false }
// );


const defaultTitle = "";
const defaultContent = "";
const defaultBanner = "";

export default function EmpowerSection({ initial, onChange }) {
  const isFirstRender = useRef(true);
  const prevInitialRef = useRef(null);
  const stateRef = useRef(null);
  
  const [state, setState] = useState(() => ({
    title: initial?.title ?? defaultTitle,
    content: initial?.content ?? defaultContent,
    banner: initial?.banner ?? defaultBanner,
  }));

  const { title, content, banner } = state;

  // keep a ref of the current state for synchronous comparisons in effects
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync state when initial prop changes
  useEffect(() => {
    // Only update if initial data actually changed (by reference)
    if (initial && initial !== prevInitialRef.current && Object.keys(initial).length > 0) {
      prevInitialRef.current = initial;
      const newState = {
        title: initial.title ?? defaultTitle,
        content: initial.content ?? defaultContent,
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

  // Call onChange only on user edits, not on initial hydration
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (onChange) {
      onChange({ title, content, banner });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, banner]);

  const setTitle = useCallback((value) => setState((prev) => ({ ...prev, title: value })), []);
  const setContent = useCallback((value) => setState((prev) => ({ ...prev, content: value })), []);
  const setBanner = useCallback((value) => setState((prev) => ({ ...prev, banner: value })), []);

  return (
    <AdminCard title="Empower Your Workforce Section">
      
      {/* TITLE INPUT */}
      <div>
        <AdminInput
          label="Empower Title*"
          value={title}
          onChange={setTitle}
        />
        <p className="text-xs text-gray-500 mt-1">
          Format: &quot;Empower Your Workforce&quot; (First part appears in blue, second part in teal on the website)
        </p>
      </div>

      {/* ⭐ Your TipTap Rich Text Editor */}
      <div className="space-y-2">
        <label className="text-gray-600 font-semibold mb-1 block">
          Empower Description*
        </label>

        <TipTapEditor
          value={content}
          onChange={setContent}
        />
      </div>

      {/* BANNER IMAGE UPLOAD */}
      <BannerBox
        label="Select Banner Image"
        image={banner}
        onUpload={setBanner}
      />
    </AdminCard>
  );
}
