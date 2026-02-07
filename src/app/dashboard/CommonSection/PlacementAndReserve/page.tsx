"use client";

import { useState, ChangeEvent, useEffect, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import { api } from "@/utils/axios";
import toast from "react-hot-toast";
import { uploadToCloudinary } from "@/services/cloudinaryUpload";
import {
  AdminCard,
  AdminInput,
  AdminTextarea,
} from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";

// Performance: Lazy load heavy drag-and-drop component to reduce initial bundle size
// This improves FCP and reduces TBT by deferring non-critical JS
const PlacementImageGrid = dynamic(
  () => import("./components/PlacementImageGrid"),
  {
    loading: () => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Loading images">
        <div className="aspect-[3/2] bg-gray-200 animate-pulse rounded-xl" />
        <div className="aspect-[3/2] bg-gray-200 animate-pulse rounded-xl" />
        <div className="aspect-[3/2] bg-gray-200 animate-pulse rounded-xl" />
        <div className="aspect-[3/2] bg-gray-200 animate-pulse rounded-xl" />
      </div>
    ),
    ssr: false, // Disable SSR for drag-and-drop component (client-only feature)
  }
);

// Performance: Memoize static components to prevent unnecessary re-renders
// Accessibility: Use semantic HTML (<section>) for better screen reader navigation
const PageCard = memo(function PageCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-white shadow-md rounded-2xl p-8 border border-gray-200 mb-8">
      {children}
    </section>
  );
});

// Performance: Memoize inner card component
// Accessibility: Use semantic HTML (<section>) for better screen reader navigation
const InnerCard = memo(function InnerCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-gray-50 border border-gray-200 rounded-2xl p-6" aria-label="Form section">
      {children}
    </section>
  );
});

function ForCorporateSectionPage() {
  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);

  const [placementsTitle, setPlacementsTitle] = useState<string>("");
  const [placementsSubtitle, setPlacementsSubtitle] = useState<string>("");
  const [placementImages, setPlacementImages] = useState<string[]>([]);

  const [reserveTitle, setReserveTitle] = useState<string>("");
  const [reserveSubtitle, setReserveSubtitle] = useState<string>("");
  const [reserveBlock1, setReserveBlock1] = useState<string>("0");
  const [reserveBlock1Label, setReserveBlock1Label] =
    useState<string>("Expert Instructors");
  const [reserveBlock2, setReserveBlock2] = useState<string>("0");
  const [reserveBlock2Label, setReserveBlock2Label] = useState<string>(
    "years of experience"
  );
  const [reserveBlock3, setReserveBlock3] = useState<string>("0");
  const [reserveBlock3Label, setReserveBlock3Label] =
    useState<string>("Success Rate");
  const [reserveButtonName, setReserveButtonName] =
    useState<string>("Enroll Now");
  const [reserveButtonLink, setReserveButtonLink] = useState<string>("");

  // Performance: Memoize image filtering logic to avoid recalculation on every render
  const filterValidImages = useCallback((rawImages: unknown[]): string[] => {
    if (!Array.isArray(rawImages)) return [];
    return rawImages.filter((img: unknown): img is string => {
      if (!img || typeof img !== "string") return false;
      // Filter out invalid backend paths
      if (img.startsWith("/mnt/") || img.startsWith("/contact-us/")) return false;
      // Keep valid URLs and frontend paths
      return img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/");
    });
  }, []);

  useEffect(() => {
    // Performance: Load data asynchronously without blocking render
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/placements-reserve");
        const data = res.data;
        if (data && isMounted) {
          setRecordId(data.id || null);

          // placements_title may be object with main
          const pt = data.placements_title?.main || data.placements_title || "";
          setPlacementsTitle(pt);
          setPlacementsSubtitle(data.placements_subtitle || "");
          
          // Use memoized filter function
          const validImages = filterValidImages(
            Array.isArray(data.placement_images) ? data.placement_images : []
          );
          setPlacementImages(validImages);

          setReserveTitle(data.reserve_title?.main || "");
          setReserveSubtitle(data.reserve_subtitle || "");
          // reserve_block may be arrays like [value, label]
          if (Array.isArray(data.reserve_block1)) {
            setReserveBlock1(String(data.reserve_block1[0] || "0"));
            setReserveBlock1Label(String(data.reserve_block1[1] || ""));
          } else {
            setReserveBlock1(String(data.reserve_block1 || "0"));
          }

          if (Array.isArray(data.reserve_block2)) {
            setReserveBlock2(String(data.reserve_block2[0] || "0"));
            setReserveBlock2Label(String(data.reserve_block2[1] || ""));
          } else {
            setReserveBlock2(String(data.reserve_block2 || "0"));
          }

          if (Array.isArray(data.reserve_block3)) {
            setReserveBlock3(String(data.reserve_block3[0] || "0"));
            setReserveBlock3Label(String(data.reserve_block3[1] || ""));
          } else {
            setReserveBlock3(String(data.reserve_block3 || "0"));
          }

          setReserveButtonName(data.reserve_button_name || "Enroll Now");
          setReserveButtonLink(data.reserve_button_link || "");
        }
      } catch (e) {
        console.debug("No placements-reserve record or fetch failed", e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [filterValidImages]);

  // Performance: useCallback to prevent recreation of function on every render
  // This reduces re-renders of child components that receive this as prop
  const handleImageChange = useCallback(async (
    e: ChangeEvent<HTMLInputElement> | { target: { files: File[] | FileList | null } },
    index?: number
  ) => {
    const files = e.target.files;
    const file = Array.isArray(files) 
      ? files[0] 
      : files?.[0] ?? null;
    if (!file) return;

    try {
      const result = await uploadToCloudinary(file);
      const url = result.secure_url; // Use secure_url for backward compatibility
      if (typeof index === "number") {
        setPlacementImages((prev) => {
          const next = [...prev];
          next[index] = url;
          return next;
        });
      } else {
        setPlacementImages((prev) => [...prev, url]);
      }
      toast.success("Image uploaded");
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed");
    }
  }, []);

  // Performance: useCallback to memoize remove function
  const removeImage = useCallback((i: number) => {
    setPlacementImages((p) => p.filter((_, idx) => idx !== i));
  }, []);

  // Performance: useCallback to memoize save handler
  // Accessibility: Function is stable for keyboard navigation
  const handleSave = useCallback(async () => {
    try {
      setLoading(true);

      const payload: Record<string, unknown> = {
        placements_title: { main: placementsTitle },
        placements_subtitle: placementsSubtitle,
        placement_images: placementImages,
        reserve_title: { main: reserveTitle },
        reserve_subtitle: reserveSubtitle,
        reserve_block1: [reserveBlock1, reserveBlock1Label],
        reserve_block2: [reserveBlock2, reserveBlock2Label],
        reserve_block3: [reserveBlock3, reserveBlock3Label],
        reserve_button_name: reserveButtonName,
        reserve_button_link: reserveButtonLink,
      };

      if (recordId) {
        await api.put(`/placements-reserve/${recordId}`, payload);
        toast.success("Updated successfully");
      } else {
        await api.post("/placements-reserve", payload);
        toast.success("Saved successfully");
      }
    } catch (err: unknown) {
      console.error("Save failed", err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Save failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    placementsTitle,
    placementsSubtitle,
    placementImages,
    reserveTitle,
    reserveSubtitle,
    reserveBlock1,
    reserveBlock1Label,
    reserveBlock2,
    reserveBlock2Label,
    reserveBlock3,
    reserveBlock3Label,
    reserveButtonName,
    reserveButtonLink,
    recordId,
  ]);

  // Performance: Memoize upload handler wrapper to prevent PlacementImageGrid re-renders
  const handleImageUpload = useCallback((file: File, index?: number) => {
    handleImageChange({ target: { files: [file] } }, index);
  }, [handleImageChange]);

  return (
    <PageCard>
      <main className="w-full">
        {/* Accessibility: Proper heading hierarchy h1 → h2 → h3 */}
        {/* Fixed typo: "Palcement" → "Placement" */}
        <h1 className="text-3xl font-bold mb-6">
          Placement and Reserve Section
        </h1>

        <PageCard>
          <h2 className="text-xl font-semibold text-gray-700 mb-6">
            Placement Section
          </h2>

          <InnerCard>
            {/* Accessibility: Proper label association with htmlFor and id */}
            {/* Note: These inputs appear to be static/read-only examples, keeping for UI consistency */}
            <label htmlFor="placement-title-heading" className="block mb-2 font-semibold text-gray-600">
              Title Heading <span className="text-red-500" aria-label="required">*</span>
            </label>

            <input
              id="placement-title-heading"
              type="text"
              defaultValue="<h2>For Corporates</h2>"
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
              aria-label="Placement title heading"
              readOnly
            />

            {/* Accessibility: Proper label association */}
            <label htmlFor="placement-description" className="block mb-2 font-semibold text-gray-600">
              Description <span className="text-red-500" aria-label="required">*</span>
            </label>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6">
              <textarea
                id="placement-description"
                rows={8}
                defaultValue={`Urna facilisis porttitor risus, erat aptent aliquam. Pellentesque quisque curae imperdiet mi accumsan mauris curabitur nibh...`}
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none"
                aria-label="Placement description"
                readOnly
              />
            </div>

            {/* IMAGE UPLOAD CARD */}
            <InnerCard>
              {/* Accessibility: Proper heading hierarchy (h3 for subsection) */}
              <h3 className="block mb-4 font-semibold text-gray-600">
                Placement Logos / Images
              </h3>

              <PlacementImageGrid
                images={placementImages}
                setImages={setPlacementImages}
                onUpload={handleImageUpload}
                onRemove={removeImage}
              />
            </InnerCard>
          </InnerCard>
        </PageCard>

        {/* RESERVE SECTION - uses AdminUI components for consistent styling */}
        {/* Accessibility: Semantic section with proper heading */}
        <section className="mt-6" aria-labelledby="reserve-section-heading">
          <AdminCard title="Reserve Section">
            <div className="space-y-4">
              <AdminInput
                label="Reserve Title"
                value={reserveTitle}
                onChange={setReserveTitle}
              />
              <AdminTextarea
                label="Reserve Subtitle"
                value={reserveSubtitle}
                onChange={setReserveSubtitle}
                rows={3}
              />

              {/* Accessibility: Use fieldset for grouped related inputs */}
              <fieldset className="grid grid-cols-3 gap-4">
                <legend className="sr-only">Reserve statistics blocks</legend>
                <div>
                  <AdminInput
                    label="Number (Box 1)"
                    value={reserveBlock1}
                    onChange={setReserveBlock1}
                  />
                  <AdminInput
                    label="Text (Box 1)"
                    value={reserveBlock1Label}
                    onChange={setReserveBlock1Label}
                  />
                </div>
                <div>
                  <AdminInput
                    label="Number (Box 2)"
                    value={reserveBlock2}
                    onChange={setReserveBlock2}
                  />
                  <AdminInput
                    label="Text (Box 2)"
                    value={reserveBlock2Label}
                    onChange={setReserveBlock2Label}
                  />
                </div>
                <div>
                  <AdminInput
                    label="Number (Box 3)"
                    value={reserveBlock3}
                    onChange={setReserveBlock3}
                  />
                  <AdminInput
                    label="Text (Box 3)"
                    value={reserveBlock3Label}
                    onChange={setReserveBlock3Label}
                  />
                </div>
              </fieldset>

              <div className="grid grid-cols-2 gap-4">
                <AdminInput
                  label="Button Name"
                  value={reserveButtonName}
                  onChange={setReserveButtonName}
                />
                <AdminInput
                  label="Button Link (Optional)"
                  value={reserveButtonLink}
                  onChange={setReserveButtonLink}
                />
              </div>
            </div>
          </AdminCard>
        </section>

        {/* SUBMIT BUTTON RIGHT */}
        {/* Accessibility: Proper button with aria-label for loading state */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-[#1A3F66] hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold shadow transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={loading ? "Saving changes, please wait" : "Save all changes"}
            aria-busy={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </main>
    </PageCard>
  );
}

// Performance: Export default with displayName for React DevTools
ForCorporateSectionPage.displayName = "ForCorporateSectionPage";

export default ForCorporateSectionPage;
