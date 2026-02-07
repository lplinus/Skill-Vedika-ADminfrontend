"use client";

import { useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function AllCourseReviews() {
  const [search, setSearch] = useState("");

  const reviews = [
    { id: 191, name: "Laravel & VUE" },
    { id: 192, name: "Building RESTful APIs with Laravel" },
    { id: 193, name: "Laravel for Beginners: From Zero to Hero" },
    { id: 194, name: "Advanced Laravel: Building Scalable Web Applications" },
    { id: 195, name: "Snowflake Training" },
    { id: 215, name: "SAP BTP Training" },
  ];

  const filteredReviews = reviews.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toString().includes(search)
  );

  return (
    <div className="p-8 bg-white rounded-3xl shadow-md border border-gray-200">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Courses Reviews</h1>

        <div className="flex items-center gap-4">
          <button className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl shadow-sm transition">
            Add New Review
          </button>

          <input
            type="text"
            placeholder="Search Course Reviews..."
            className="px-4 py-2 border border-gray-300 rounded-xl shadow-sm w-64 focus:ring focus:ring-blue-200 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-3xl border border-gray-200 shadow-sm backdrop-blur-xl bg-white/80">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100/60 backdrop-blur-xl border-b border-gray-200">
              <th className="py-4 px-6 font-semibold text-gray-700 border-b">Course ID</th>
              <th className="py-4 px-6 font-semibold text-gray-700 border-b">Course Name</th>
              <th className="py-4 px-6 font-semibold text-gray-700 border-b">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredReviews.map((row) => (
              <tr key={row.id} className="border-gray-200">
                <td className="py-4 px-6 text-gray-800">{row.id}</td>
                <td className="py-4 px-6 text-gray-800">{row.name}</td>

                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <button className="text-yellow-600 bg-[#FFF6C4] p-2 rounded-xl shadow-sm hover:bg-[#FFEF9E] transition flex items-center justify-center">
                      <FaEdit size={18} />
                    </button>
                    <button className="text-red-600 bg-[#FFE3E3] p-2 rounded-xl shadow-sm hover:bg-[#FFCCCC] transition flex items-center justify-center">
                      <FaTrash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredReviews.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="py-6 text-center text-gray-500 italic"
                >
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
