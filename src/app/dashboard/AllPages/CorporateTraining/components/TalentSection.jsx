
"use client";

import { useState, useEffect, useRef } from "react";
import { AdminCard, AdminInput } from "./AdminUI";
import dynamic from "next/dynamic";

// Load TipTapEditor dynamically
const TipTapEditor = dynamic(() => import("./TipTapEditor"), {
  ssr: false,
});

export default function TalentSection({ initial = {}, onChange }) {
  const isFirstRender = useRef(true);
  const prevInitialRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const prevStateRef = useRef({ title: "", desc: "", points: [] });

  // Store onChange in ref to avoid dependency issues
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Local editable state — DOES NOT get reset on parent re-render
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [points, setPoints] = useState([]);

  // Hydrate ONLY when backend data first loads or when initial actually changes
  useEffect(() => {
    // Skip if initial is empty
    if (!initial || Object.keys(initial).length === 0) return;
    
    // Use deep comparison to prevent unnecessary updates
    const currentDesc = initial.description ?? initial.desc ?? "";
    const prevDesc = prevInitialRef.current ? (prevInitialRef.current.description ?? prevInitialRef.current.desc ?? "") : "";
    
    const currentInitialStr = JSON.stringify({
      title: initial.title ?? "",
      description: currentDesc,
      points: Array.isArray(initial.points) ? initial.points : []
    });
    const prevInitialStr = prevInitialRef.current ? JSON.stringify({
      title: prevInitialRef.current.title ?? "",
      description: prevDesc,
      points: Array.isArray(prevInitialRef.current.points) ? prevInitialRef.current.points : []
    }) : null;
    
    // Only update if data actually changed
    if (currentInitialStr === prevInitialStr) return;
    
    prevInitialRef.current = initial;

    setTitle(initial.title ?? "");
    setDesc(initial.description ?? initial.desc ?? "");
    // Add id field to points for React keys (will be removed before saving)
    const pointsWithId = Array.isArray(initial.points) 
      ? initial.points.map((p, idx) => ({ ...p, id: p.id || `step-${p.step || idx}` }))
      : [];
    setPoints(pointsWithId);
  }, [initial]);

  // Notify parent when local state changes (but skip during initial hydration)
  useEffect(() => {
    // Skip onChange during first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevStateRef.current = { title, desc, points };
      return;
    }
    
    // Only call onChange if state actually changed
    // Remove 'id' field from points before sending to parent (id is only for React keys)
    const pointsWithoutId = points.map(({ id, ...rest }) => rest);
    const currentState = { title, desc, points: pointsWithoutId };
    const prevState = prevStateRef.current;
    
    if (
      prevState.title === currentState.title &&
      prevState.desc === currentState.desc &&
      JSON.stringify(prevState.points) === JSON.stringify(currentState.points)
    ) {
      return;
    }
    
    prevStateRef.current = currentState;
    
    if (onChangeRef.current) {
      onChangeRef.current(currentState);
    }
  }, [title, desc, points]);

  const addStep = () => {
    const stepNumber = String(points.length + 1).padStart(2, "0");
    setPoints([...points, { 
      id: `step-${Date.now()}-${Math.random()}`, 
      step: stepNumber, 
      title: "", 
      description: "" 
    }]);
  };

  const updateStep = (index, field, value) => {
    const newPoints = [...points];
    newPoints[index] = { 
      ...newPoints[index], 
      [field]: value,
      id: newPoints[index].id || `step-${index}` // Ensure id exists
    };
    setPoints(newPoints);
  };

  const removeStep = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    // Re-number steps after removal
    const renumbered = newPoints.map((p, i) => ({
      ...p,
      step: String(i + 1).padStart(2, "0"),
    }));
    setPoints(renumbered);
  };

  return (
    <AdminCard title="Talent Development Section">

      <div>
      <AdminInput
        label="Title*"
        value={title}
        onChange={setTitle}     
      />
        <p className="text-xs text-gray-500 mt-1">
          Format: "SkillVedika for Talent Development" 
          (First word gets gradient styling on website, rest is plain text)
        </p>
      </div>

      {/* TipTap Rich Text Editor for Description */}
      <div className="space-y-2">
        <label className="text-gray-600 font-semibold mb-1 block">
          Description*
        </label>
        <TipTapEditor
        value={desc}
        onChange={setDesc}
        />
      </div>

      {/* Steps Management */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-700">
            Process Steps
          </h3>
          <button
            type="button"
            onClick={addStep}
            className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition cursor-pointer"
          >
            + Add Step
          </button>
        </div>

        {points.map((step, index) => (
          <div
            key={step.id || `step-${index}`}
            className="p-4 border border-gray-200 rounded-lg space-y-3 bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Step {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeStep(index)}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
              >
                Remove
              </button>
            </div>

            <AdminInput
              label="Step Number*"
              value={step.step || String(index + 1).padStart(2, "0")}
              onChange={(v) => updateStep(index, "step", v)}
            />

            <AdminInput
              label="Step Title*"
              value={step.title || ""}
              onChange={(v) => updateStep(index, "title", v)}
            />

            {/* TipTap Rich Text Editor for Step Description */}
            <div className="space-y-2">
              <label className="text-gray-600 font-semibold mb-1 block">
                Step Description*
              </label>
              <TipTapEditor
                value={step.description || ""}
                onChange={(v) => updateStep(index, "description", v)}
              />
            </div>
          </div>
        ))}

        {points.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No steps added yet. Click "Add Step" to create the first step.
          </p>
        )}
      </div>

    </AdminCard>
  );
}
