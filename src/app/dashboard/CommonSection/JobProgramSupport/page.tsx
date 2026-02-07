"use client";

import { useState, ChangeEvent } from "react";
import Image from "next/image";
import { FiUploadCloud } from "react-icons/fi";

export default function JobProgramSupportPage() {
  const [heroTitle, setHeroTitle] = useState("Job Program <span>Support</span>");
  const [heroDescription, setHeroDescription] = useState(
    "We provide precise options tailored to your project tasks. Whether you are a newbie or an experienced professional needing assistance, our plans are designed to meet your unique needs:"
  );
  const [heroBanner, setHeroBanner] = useState<string | null>(null);

  const [payment1, setPayment1] = useState("Hourly");
  const [payment2, setPayment2] = useState("Monthly");
  const [payment3, setPayment3] = useState("Weekly");

  const handleBannerChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setHeroBanner(URL.createObjectURL(file));
  };

  return (
    <section className="p-8 space-y-10">

      {/* MAIN PAGE TITLE */}
      <h1 className="text-3xl font-bold text-gray-900">Job Program Support</h1>

      {/* =====================================================
           HERO SECTION CARD
      ===================================================== */}
      <div
        className="bg-gray-50 rounded-xl p-6 space-y-6 shadow-sm"
        style={{ border: "1px solid rgba(16,24,40,0.08)" }}
      >
        <h2 className="text-xl font-semibold text-gray-700">
          Hero Section
        </h2>

        {/* Title Input */}
        <div>
          <label className="font-semibold text-gray-600 mb-1 block">
            Hero Title*
          </label>
          <input
            type="text"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white
              focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-semibold text-gray-600 mb-1 block">
            Hero Description*
          </label>
          <textarea
            rows={5}
            value={heroDescription}
            onChange={(e) => setHeroDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white
              focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Banner Upload Box */}
        <div
          className="p-4 bg-white rounded-xl shadow-sm"
          style={{ border: "1px solid rgba(16,24,40,0.08)" }}
        >
          <label className="block mb-3 font-semibold text-gray-600">
            Select Hero Banner Image
          </label>

          <div className="flex items-center gap-4">
            <label className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer transition flex items-center gap-2">
              <FiUploadCloud size={18} />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </label>

            {/* Preview */}
            {heroBanner && (
              <Image
                src={heroBanner}
                alt="Preview"
                width={80}
                height={80}
                className="rounded-lg border object-cover"
              />
            )}
          </div>
        </div>
      </div>


      {/* =====================================================
            PAYMENT TYPES SECTION
      ===================================================== */}
      <div
        className="bg-gray-50 rounded-xl p-6 space-y-6 shadow-sm"
        style={{ border: "1px solid rgba(16,24,40,0.08)" }}
      >
        <h2 className="text-xl font-semibold text-gray-700">Payment Types</h2>

        {/* Payment Input 1 */}
        <div>
          <label className="font-semibold text-gray-600 mb-1 block">
            Payment Type 1*
          </label>
          <input
            type="text"
            value={payment1}
            onChange={(e) => setPayment1(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white
              focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Payment Input 2 */}
        <div>
          <label className="font-semibold text-gray-600 mb-1 block">
            Payment Type 2*
          </label>
          <input
            type="text"
            value={payment2}
            onChange={(e) => setPayment2(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white
              focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Payment Input 3 */}
        <div>
          <label className="font-semibold text-gray-600 mb-1 block">
            Payment Type 3*
          </label>
          <input
            type="text"
            value={payment3}
            onChange={(e) => setPayment3(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white
              focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button className="px-6 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer shadow-sm">
            Submit
          </button>
        </div>
      </div>

    </section>
  );
}
