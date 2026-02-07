// // "use client"; // Already present in original code

import { FiUploadCloud } from "react-icons/fi";
import React, { useState, useEffect, ReactNode, useId } from "react";
import { uploadToCloudinary } from "@/services/cloudinaryUpload";
import toast from "react-hot-toast";

/* --------------------------------
   Admin Card
-------------------------------- */
export function AdminCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="bg-gray-50 p-6 rounded-xl space-y-5 shadow-sm"
      style={{ border: "1px solid rgba(16,24,40,0.08)" }}
    >
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      {children}
    </div>
  );
}

/* --------------------------------
   Admin Input (SAFE UPDATE)
-------------------------------- */
function AdminInputComponent({
  label,
  value,
  onChange,
  onBlur,
  id,
  required,
  placeholder,
  type = "text", // ✅ default keeps old behavior
  disabled = false,
}: {
  label: string;
  value: string | undefined;
  onChange?: (val: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  id?: string;
  required?: boolean;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  disabled?: boolean;
}) {
  const inputId =
    id || `admin-input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="text-gray-600 font-semibold mb-1 block"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={(e) => onBlur?.(e)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white
                   focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                   focus:outline-none transition"
        aria-required={required}
        aria-label={label}
      />
    </div>
  );
}

export const AdminInput = React.memo(AdminInputComponent);

/* --------------------------------
   Admin Textarea (NO BREAKING CHANGE)
-------------------------------- */
function AdminTextareaComponent({
  label,
  value,
  onChange,
  rows = 4,
  onBlur,
  id,
  required,
  placeholder,
}: {
  label?: string;
  value: string | undefined;
  onChange?: (val: string) => void;
  rows?: number;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  id?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const reactId = useId();

  const textareaId =
    id ||
    (label
      ? `admin-textarea-${label.toLowerCase().replace(/\s+/g, "-")}`
      : `admin-textarea-${reactId}`);

  return (
    <div>
      {label && (
        <label
          htmlFor={textareaId}
          className="text-gray-600 font-semibold mb-1 block"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={(e) => onBlur?.(e)}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white
                   focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                   focus:outline-none transition"
        aria-required={required}
        aria-label={label}
      />
    </div>
  );
}

export const AdminTextarea = React.memo(AdminTextareaComponent);

/* --------------------------------
   Banner Box (UNCHANGED)
-------------------------------- */
// export function BannerBox({
//   label,
//   image,
//   onUpload,
//   iconSize = 18,
// }: {
//   label: string;
//   image: string | Record<string, unknown> | undefined;
//   onUpload: (url: string) => void;
//   iconSize?: number;
// }) {
//   const [isUploading, setIsUploading] = useState(false);
//   const [previewSrc, setPreviewSrc] = useState<string>(
//     typeof image === "string" ? image : ""
//   );

//   useEffect(() => {
//     if (typeof image === "string") {
//       setPreviewSrc(image);
//     }
//   }, [image]);

//   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     // instant preview
//     setPreviewSrc(URL.createObjectURL(file));

//     setIsUploading(true);
//     try {
//       const result = await uploadToCloudinary(file);
//       onUpload(result.secure_url); // ✅ store FULL URL
//       setPreviewSrc(result.secure_url);
//       toast.success("Image uploaded successfully!");
//     } catch (error: any) {
//       toast.error(error?.message || "Image upload failed");
//       setPreviewSrc(typeof image === "string" ? image : "");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div
//       className="p-4 rounded-xl bg-white shadow-sm"
//       style={{ border: "1px solid rgba(16,24,40,0.08)" }}
//     >
//       <label className="block text-gray-600 font-semibold mb-2">
//         {label}
//       </label>

//       <div className="flex items-center gap-4">
//         <label className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer transition flex items-center gap-2">
//           <FiUploadCloud size={iconSize} />
//           {isUploading ? "Uploading..." : "Upload Image"}
//           <input
//             type="file"
//             accept="image/*"
//             className="hidden"
//             onChange={handleFileSelect}
//             disabled={isUploading}
//           />
//         </label>

//         {previewSrc && (
//           <img
//             src={previewSrc}
//             alt="Hero Preview"
//             className="h-16 w-16 rounded-lg object-cover border"
//           />
//         )}
//       </div>
//     </div>
//   );
// }


export function BannerBox({
  label,
  image,
  onUpload,
  iconSize = 18,
}: {
  label: string;
  image: string | Record<string, unknown> | undefined;
  onUpload: (url: string) => void;
  iconSize?: number;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>(
    typeof image === 'string' ? image : ''
  );

  useEffect(() => {
    if (typeof image === 'string') {
      setPreviewSrc(image);
    }
  }, [image]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // instant preview
    const localPreview = URL.createObjectURL(file);
    setPreviewSrc(localPreview);

    setIsUploading(true);
    try {
      const result = await uploadToCloudinary(file);
      onUpload(result.secure_url); // save URL
      setPreviewSrc(result.secure_url);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Image upload failed');
      setPreviewSrc(typeof image === 'string' ? image : '');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewSrc('');
    onUpload(''); // clear value in parent state
    toast('Image removed', { icon: '🗑️' });
  };

  return (
    <div
      className="p-4 rounded-xl bg-white shadow-sm"
      style={{ border: '1px solid rgba(16,24,40,0.08)' }}
    >
      <label className="block text-gray-600 font-semibold mb-2">
        {label}
      </label>

      <div className="flex items-center gap-4">
        <label className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer transition flex items-center gap-2">
          <FiUploadCloud size={iconSize} />
          {isUploading ? 'Uploading...' : 'Upload Image'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>

        {previewSrc && (
          <div className="relative">
            <img
              src={previewSrc}
              alt="Preview"
              className="h-20 w-20 rounded-lg object-cover border"
            />

            {/* ❌ Remove button */}
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-red-700 transition"
              title="Remove image"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

