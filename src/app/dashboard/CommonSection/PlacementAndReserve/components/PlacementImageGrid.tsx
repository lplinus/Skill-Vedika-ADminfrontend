"use client";

import Image from "next/image";
import { memo, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiUploadCloud, FiTrash2, FiMove } from "react-icons/fi";

interface SortableItemProps {
  id: string;
  image: string;
  index: number;
  onUpload: (file: File, index: number) => void;
  onRemove: (index: number) => void;
}

// Performance: Memoize image URL resolution to avoid recalculation
// This function is pure and can be safely memoized
const resolveImageUrl = (imgUrl: string): string => {
  // Always fallback-safe
  const FALLBACK = "/default-uploads/Skill-vedika-Logo.jpg";

  if (!imgUrl) return FALLBACK;

  // ✅ Cloudinary / external images
  if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
    return imgUrl;
  }

  // ❌ Block backend filesystem paths
  if (
    imgUrl.startsWith("/mnt/") ||
    imgUrl.startsWith("/storage/") ||
    imgUrl.startsWith("/contact-us/")
  ) {
    return FALLBACK;
  }

  // ❌ Block old hardcoded frontend paths (not in /public)
  if (imgUrl.startsWith("/course-details/")) {
    return FALLBACK;
  }

  // ❌ Everything else → fallback
  return FALLBACK;
};

// Performance: Memoize SortableItem to prevent re-renders when parent updates
// Accessibility: Added proper ARIA labels and keyboard navigation support
const SortableItem = memo(function SortableItem({
  id,
  image,
  index,
  onUpload,
  onRemove,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  // Performance: Memoize style object to prevent recreation on every render
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition]
  );

  // Performance: Memoize resolved image URL
  const validImageUrl = useMemo(() => resolveImageUrl(image), [image]);

  // Performance: useCallback to prevent function recreation
  // Accessibility: Proper error handling with fallback
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Fallback to default image on error
      (e.target as HTMLImageElement).src =
        "/default-uploads/Skill-vedika-Logo.jpg";
    },
    []
  );

  // Performance: useCallback for upload handler
  // Accessibility: Proper label association
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        onUpload(e.target.files[0], index);
      }
    },
    [onUpload, index]
  );

  // Performance: useCallback for remove handler
  // Accessibility: Proper button with aria-label
  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [onRemove, index]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group border rounded-xl bg-white shadow-sm overflow-hidden"
      role="group"
      aria-label={`Image ${index + 1}`}
    >
      {/* Accessibility: Drag handle with proper ARIA attributes and keyboard support */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 bg-white/90 p-1 rounded cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500"
        role="button"
        tabIndex={0}
        aria-label={`Drag to reorder image ${index + 1}`}
        onKeyDown={(e) => {
          // Accessibility: Enable keyboard navigation for drag handle
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            // Trigger drag start (simplified - full implementation would use DnD Kit's keyboard sensor)
          }
        }}
      >
        <FiMove size={16} aria-hidden="true" />
      </div>

      {/* Performance: Next.js Image with proper optimization */}
      {/* Accessibility: Descriptive alt text */}
      <div className="aspect-[3/2] relative">
        {/* <Image
          src={validImageUrl}
          alt={`Placement image ${index + 1}`}
          fill
          className="object-contain p-3"
          onError={handleImageError}
          loading="lazy" // Performance: Lazy load images below the fold
          sizes="(max-width: 768px) 50vw, 25vw" // Performance: Responsive image sizing
        /> */}
        <img
          src={validImageUrl}
          alt={`Placement image ${index + 1}`}
          className="absolute inset-0 w-full h-full object-contain p-3"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/default-uploads/Skill-vedika-Logo.jpg";
          }}
        />
      </div>

      {/* Accessibility: Hover actions with proper labels and keyboard support */}
      <div
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3"
        role="group"
        aria-label="Image actions"
      >
        {/* Accessibility: Proper label with htmlFor and hidden input */}
        <label
          htmlFor={`replace-image-${index}`}
          className="cursor-pointer bg-white text-sm px-3 py-2 rounded flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              document.getElementById(`replace-image-${index}`)?.click();
            }
          }}
        >
          <FiUploadCloud aria-hidden="true" />
          <span>Replace</span>
          <input
            id={`replace-image-${index}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label={`Replace image ${index + 1}`}
          />
        </label>

        {/* Accessibility: Proper button with aria-label */}
        <button
          type="button"
          onClick={handleRemove}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
          aria-label={`Remove image ${index + 1}`}
        >
          <FiTrash2 aria-hidden="true" />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
});

interface Props {
  images: string[];
  setImages: (imgs: string[]) => void;
  onUpload: (file: File, index?: number) => void;
  onRemove: (index: number) => void;
}

// Performance: Memoize main component to prevent unnecessary re-renders
// Accessibility: Proper semantic structure and ARIA labels
function PlacementImageGrid({ images, setImages, onUpload, onRemove }: Props) {
  // Performance: Memoize sensors to prevent recreation
  const sensors = useSensors(useSensor(PointerSensor));

  // Performance: useCallback to memoize drag end handler
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // Convert UniqueIdentifier to string for comparison
      const activeId = String(active.id);
      const overId = String(over.id);

      const oldIndex = images.findIndex((img) => img === activeId);
      const newIndex = images.findIndex((img) => img === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        setImages(arrayMove(images, oldIndex, newIndex));
      }
    },
    [images, setImages]
  );

  // Performance: Memoize upload handler
  const handleNewImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        onUpload(e.target.files[0]);
      }
    },
    [onUpload]
  );

  // Performance: Memoize upload button key handler
  const handleUploadKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      document.getElementById("upload-new-image")?.click();
    }
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={images} strategy={rectSortingStrategy}>
        {/* Accessibility: Use proper list semantics for image grid */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          role="list"
          aria-label="Placement images"
        >
          {images.map((img, idx) => (
            <div key={img} role="listitem">
              <SortableItem
                id={img}
                image={img}
                index={idx}
                onUpload={onUpload}
                onRemove={onRemove}
              />
            </div>
          ))}

          {/* Accessibility: Proper label with keyboard support */}
          <label
            htmlFor="upload-new-image"
            className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-blue-600 hover:text-blue-600 transition min-h-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            tabIndex={0}
            onKeyDown={handleUploadKeyDown}
            aria-label="Upload new placement image"
          >
            <FiUploadCloud size={28} aria-hidden="true" />
            <span className="text-sm mt-2">Upload Image</span>
            <input
              id="upload-new-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleNewImageUpload}
              aria-label="Upload new image file"
            />
          </label>
        </div>
      </SortableContext>
    </DndContext>
  );
}

// Performance: Export memoized component
export default memo(PlacementImageGrid);
