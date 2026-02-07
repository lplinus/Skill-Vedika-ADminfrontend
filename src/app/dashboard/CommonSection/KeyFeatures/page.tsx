"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";
import { FiUploadCloud } from "react-icons/fi";

// === OUTER WHITE CARD ===
function PageCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200 mb-8">
      {children}
    </div>
  );
}

// === INNER LIGHT GRAY CARD ===
function InnerCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 mb-6 shadow-sm">{children}</div>
  );
}

// === UPLOAD BOX ===
function UploadBox({
  label,
  preview,
  onChange,
}: {
  label: string;
  preview: string | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <InnerCard>
      <label className="block mb-3 font-semibold text-gray-600">{label}</label>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 bg-[#1A3F66] hover:bg-blue-800 text-white px-5 py-3 rounded-lg shadow cursor-pointer transition">
          <FiUploadCloud size={20} /> Choose Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onChange}
          />
        </label>

        {preview && (
          <div className="rounded-xl w-28 h-28 bg-white shadow flex items-center justify-center">
            <Image
              src={preview}
              alt="preview"
              width={110}
              height={110}
              className="rounded-xl object-cover"
            />
          </div>
        )}
      </div>
    </InnerCard>
  );
}

export default function KeyFeaturesPage() {
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [icon1, setIcon1] = useState<string | null>(null);
  const [icon2, setIcon2] = useState<string | null>(null);
  const [icon3, setIcon3] = useState<string | null>(null);
  const [icon4, setIcon4] = useState<string | null>(null);

  return (
    <PageCard>
      <div className="w-full">
        {/* FULL PAGE CARD START */}

        {/* PAGE HEAD */}
        <h1 className="text-3xl font-bold mb-6">Key Features Section</h1>

        {/* HERO SECTION CARD */}
        <PageCard>
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            Key Feature Hero Section
          </h2>

          <InnerCard>
            <label className="block mb-2 font-semibold text-gray-600">
              Title Heading <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              defaultValue="Key Features Of The Skillvedika"
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <label className="block mb-2 font-semibold text-gray-600">
              Title Description
            </label>
            <textarea
              rows={4}
              defaultValue="We believe in providing the best technology training loaded with essential features to deliver outstanding learning experience."
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <UploadBox
              label="Select Banner"
              preview={bannerPreview}
              onChange={(e) =>
                setBannerPreview(
                  URL.createObjectURL(e.target.files?.[0] as File)
                )
              }
            />
          </InnerCard>
        </PageCard>

        {/* FEATURE BOX 1 */}
        <PageCard>
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            Key Feature Box 1
          </h2>

          <InnerCard>
            <label className="block mb-2 font-semibold text-gray-600">
              Feature Title
            </label>
            <input
              type="text"
              defaultValue="Industry standard curriculum"
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <label className="block mb-2 font-semibold text-gray-600 ">
              Feature Description
            </label>
            <textarea
              rows={3}
              defaultValue="Every technology syllabus is tailored to meet current industry requirements."
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <UploadBox
              label="Select Key Feature Icon"
              preview={icon1}
              onChange={(e) =>
                setIcon1(URL.createObjectURL(e.target.files?.[0] as File))
              }
            />
          </InnerCard>
        </PageCard>

        {/* FEATURE BOX 2 */}
        <PageCard>
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            Key Feature Box 2
          </h2>

          <InnerCard>
            <label className="block mb-2 font-semibold text-gray-600">
              Feature Title
            </label>
            <input
              type="text"
              defaultValue="Real world projects"
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <label className="block mb-2 font-semibold text-gray-600">
              Feature Description
            </label>
            <textarea
              rows={3}
              defaultValue="Explore how technologies interact with the real world using industrial use cases."
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <UploadBox
              label="Select Key Feature Icon"
              preview={icon2}
              onChange={(e) =>
                setIcon2(URL.createObjectURL(e.target.files?.[0] as File))
              }
            />
          </InnerCard>
        </PageCard>

        {/* FEATURE BOX 3 */}
        <PageCard>
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            Key Feature Box 3
          </h2>

          <InnerCard>
            <label className="block mb-2 font-semibold text-gray-600">
              Feature Title
            </label>
            <input
              type="text"
              defaultValue="Flexible schedules"
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <label className="block mb-2 font-semibold text-gray-600">
              Feature Description
            </label>
            <textarea
              rows={3}
              defaultValue="Every technology syllabus is tailored to meet current industry requirements."
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <UploadBox
              label="Select Key Feature Icon"
              preview={icon3}
              onChange={(e) =>
                setIcon3(URL.createObjectURL(e.target.files?.[0] as File))
              }
            />
          </InnerCard>
        </PageCard>

        {/* FEATURE BOX 4 */}
        <PageCard>
          <h2 className="text-xl font-semibold mb-6 text-gray-700">
            Key Feature Box 4
          </h2>

          <InnerCard>
            <label className="block mb-2 font-semibold text-gray-600">
              Feature Title
            </label>
            <input
              type="text"
              defaultValue="Official certification guidance"
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <label className="block mb-2 font-semibold text-gray-600">
              Feature Description
            </label>
            <textarea
              rows={3}
              defaultValue="Along with the course completion certificate, we assure you with official certificate guidance."
              className="w-full border border-gray-300 rounded-lg p-3 shadow-sm mb-6"
            />

            <UploadBox
              label="Select Key Feature Icon"
              preview={icon4}
              onChange={(e) =>
                setIcon4(URL.createObjectURL(e.target.files?.[0] as File))
              }
            />
          </InnerCard>
        </PageCard>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end mt-6 mb-6">
          <button className="bg-[#1A3F66] hover:bg-blue-800 text-white px-10 py-3 rounded-lg font-semibold shadow transition cursor-pointer">
            Submit
          </button>
        </div>

        {/* FULL PAGE CARD END */}
      </div>
    </PageCard>
  );
}
