/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AdminCard, AdminInput, AdminTextarea } from "./AdminUI";

const defaultTitle = "";
const defaultDesc = "";

export default function AdvantageSection({ initial = {}, onChange }) {
  const isFirstRender = useRef(true);
  const prevInitialRef = useRef(null);
  const stateRef = useRef(null);
  const buildInitialSections = (initialData) => {
    const incoming = Array.isArray(initialData?.sections)
      ? [...initialData.sections]
      : [];
    // Return only the sections provided by initial data, no defaults
    return incoming;
  };

  const [state, setState] = useState(() => ({
    title: initial?.title ?? defaultTitle,
    // support either `desc` or `description` coming from parent/backend
    desc: initial?.desc ?? initial?.description ?? defaultDesc,
    sections: buildInitialSections(initial),
  }));

  const { title, desc, sections } = state;

  // keep a ref of the current state for synchronous comparisons in effects
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    // Only update if initial data actually changed (by reference)
    if (initial && initial !== prevInitialRef.current && Object.keys(initial).length > 0) {
      prevInitialRef.current = initial;
      const newSections = buildInitialSections(initial);
      const newState = {
        title: initial.title ?? defaultTitle,
        desc: initial.desc ?? initial.description ?? defaultDesc,
        sections: newSections,
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
      onChange({ title, desc, sections });
    }
  }, [title, desc, sections]);

  const setTitle = useCallback((value) => setState((prev) => ({ ...prev, title: value })), []);
  const setDesc = useCallback((value) => setState((prev) => ({ ...prev, desc: value })), []);

  const updateSection = useCallback((i, key, value) => {
    setState((prev) => {
      const prevSections = Array.isArray(prev.sections) ? [...prev.sections] : buildInitialSections(prev);
      prevSections[i] = { ...prevSections[i], [key]: value };
      return { ...prev, sections: prevSections };
    });
  }, []);

  return (
    <AdminCard title="Advantage Corporate Training">
      <div>
        <AdminInput 
          label="Title*" 
          value={title} 
          onChange={setTitle} 
        />
        <p className="text-xs text-gray-500 mt-1">
          Format: "The SkillVedika Advantage" or "The &lt;highlight&gt;SkillVedika&lt;/highlight&gt; Advantage" 
          (The highlighted word will appear with gradient styling on the website)
        </p>
      </div>

      <AdminTextarea label="Description*" value={desc} onChange={setDesc} rows={3} />

      {(Array.isArray(sections) ? sections : []).map((sec, index) => (
        <div key={index} className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-700">
            Advantage Training Section {index + 1}
          </h3>
          <AdminInput
            label="Section Title*"
            value={sec.title}
            onChange={(v) => updateSection(index, "title", v)}
          />

          <AdminTextarea
            label="Section Content*"
            rows={5}
            value={sec.content || sec.description || ""}
            onChange={(v) => updateSection(index, "content", v)}
          />
        </div>
      ))}
    </AdminCard>
  );
}
