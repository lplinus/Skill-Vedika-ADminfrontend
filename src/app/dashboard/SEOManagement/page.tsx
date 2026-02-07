"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/utils/axios"; // ← your axios instance
import { FiSearch } from "react-icons/fi";
import { FaEdit } from "react-icons/fa";
import toast from "react-hot-toast";

import { AdminInput, AdminTextarea } from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";

interface SeoRow {
  id: number;
  slug: string;
  page_name: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  updated_at: string;
}

export default function SEOManagementPage() {
  const [rows, setRows] = useState<SeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [pageName, setPageName] = useState("");
  const [slug, setSlug] = useState("");

  // -------------------------------------------
  // LOAD ALL SEO ROWS
  // -------------------------------------------
  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Debug: Log the API URL being called
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      console.log("Fetching SEO data from:", `${apiBaseUrl}/api/seo`);
      
      const res = await api.get("/seo");
      // backend returns either a single object (latest) or an array depending on implementation.
      // Normalize into an array for the UI table.
      const payload = res.data?.data;
      if (Array.isArray(payload)) setRows(payload);
      else if (payload) setRows([payload]);
      else setRows([]);
    } catch (err: any) {
      console.error("Error fetching SEO data:", err);
      
      let errorMessage = "Failed to load SEO data. Please try again.";
      
      // Provide user-friendly error messages
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = "Network error: Could not connect to backend. Please check:\n1. Backend server is running\n2. NEXT_PUBLIC_API_URL is correctly set\n3. CORS is properly configured";
        toast.error("Network error: Could not connect to backend.");
      } else if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const message = err.response.data?.message || `Server error (${status})`;
        errorMessage = `Server error: ${message}`;
        toast.error(`Failed to load SEO data: ${message}`);
      } else {
        toast.error("Failed to load SEO data. Please try again.");
      }
      
      setError(errorMessage);
      // Set empty array on error to prevent UI issues
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // call fetchRows inside effect via the stable callback
    void fetchRows();
  }, [fetchRows]);

  // -------------------------------------------
  // OPEN MODAL + LOAD SEO DETAILS
  // -------------------------------------------
  const openEditModal = async (rowSlug: string) => {
    setSelectedSlug(rowSlug);
    setIsCreating(false);
    setOpenModal(true);

    try {
      const res = await api.get(`/seo/${rowSlug}`);
      const data = res.data.data;

      setPageName(data.page_name);
      setMetaTitle(data.meta_title || "");
      setMetaDescription(data.meta_description || "");
      setMetaKeywords(data.meta_keywords || "");
      setSlug(data.slug || "");
    } catch (err: any) {
      console.error("Error loading SEO details:", err);
      
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        toast.error("Network error: Could not connect to backend.");
      } else if (err.response?.status === 404) {
        toast.error("SEO entry not found.");
        setOpenModal(false);
      } else {
        toast.error("Failed to load SEO details. Please try again.");
      }
    }
  };

  // -------------------------------------------
  // OPEN CREATE MODAL
  // -------------------------------------------
  const openCreateModal = () => {
    setSelectedSlug(null);
    setIsCreating(true);
    setOpenModal(true);
    setPageName("");
    setMetaTitle("");
    setMetaDescription("");
    setMetaKeywords("");
    setSlug("");
  };

  // -------------------------------------------
  // SAVE SEO (CREATE OR UPDATE)
  // -------------------------------------------
  const handleSave = async () => {
    // Validation
    if (!metaTitle.trim()) {
      toast.error("Meta Title is required");
      return;
    }
    if (!metaDescription.trim()) {
      toast.error("Meta Description is required");
      return;
    }
    if (!metaKeywords.trim()) {
      toast.error("Meta Keywords is required");
      return;
    }

    try {
      if (isCreating) {
        // Create new SEO entry
        if (!slug.trim()) {
          toast.error("Slug is required for new entries");
          return;
        }
        if (!pageName.trim()) {
          toast.error("Page Name is required");
          return;
        }

        // Validate slug format (lowercase, hyphen-separated)
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(slug.trim())) {
          toast.error("Slug must be lowercase and hyphen-separated (e.g., 'about-us')");
          return;
        }

        await api.post("/seo", {
          slug: slug.trim().toLowerCase(),
          page_name: pageName.trim(),
          meta_title: metaTitle.trim(),
          meta_description: metaDescription.trim(),
          meta_keywords: metaKeywords.trim(),
        });

        toast.success("SEO created successfully!");
      } else {
        // Update existing SEO entry
        if (!selectedSlug) return;

        await api.patch(`/seo/${selectedSlug}`, {
          meta_title: metaTitle.trim(),
          meta_description: metaDescription.trim(),
          meta_keywords: metaKeywords.trim(),
          // page_name: pageName.trim(),
        });

        toast.success("SEO updated successfully!");
      }

      setOpenModal(false);
      fetchRows();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.response?.data?.message || 
        (isCreating ? "Failed to create SEO" : "Failed to update SEO");
      toast.error(errorMessage);
    }
  };

  // -------------------------------------------
  // FILTER TABLE
  // -------------------------------------------
  const filteredRows = rows.filter((row) =>
    row.page_name.toLowerCase().includes(search.toLowerCase()) ||
    row.slug.toLowerCase().includes(search.toLowerCase())
  );
  

  return (
    <div className="bg-white shadow-sm rounded-2xl p-8 mb-8">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">All SEO</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg shadow"
          >
            Create New SEO
          </button>
          <div className="relative w-72">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="search page..."
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-gray-50 p-6 rounded-xl shadow-sm">
        {loading && (
          <div className="text-center py-8 text-gray-600">
            Loading SEO data...
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 font-medium mb-2">Error Loading Data</p>
            <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
            <button
              onClick={() => fetchRows()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-0">
              <thead>
                <tr className="text-gray-700 font-semibold">
                  <th className="py-3 px-4">Page Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Meta Title</th>
                  <th className="py-3 px-4">Meta Description</th>
                  <th className="py-3 px-4">Last Updated Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-500 py-4 text-sm"
                    >
                      No SEO data found.
                    </td>
                  </tr>
                )}

              {filteredRows.map((row) => (
                <tr
                  key={row.slug || row.id}
                  className="bg-white shadow rounded-lg hover:shadow-md transition"
                >
                  <td className="py-3 px-4 font-medium">{row.page_name}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-sm">{row.slug || 'N/A'}</td>
                  <td className="py-3 px-4">{row.meta_title}</td>
                  <td className="py-3 px-4 truncate max-w-xs">
                    {row.meta_description}
                  </td>
                  <td className="py-3 px-4">
                    {new Date(row.updated_at).toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => row.slug && openEditModal(row.slug)}
                      disabled={!row.slug}
                      className={`p-2 rounded-lg shadow transition ${
                        row.slug 
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <FaEdit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------- */}
      {/* CREATE/EDIT MODAL */}
      {/* ------------------------------------------- */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[600px] shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">
              {isCreating ? 'Create New SEO' : 'Edit SEO'} — <span className="text-blue-700">{pageName || 'New Page'}</span>
            </h2>

            {isCreating && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug* (lowercase, hyphen-separated, e.g., &apos;about-us&apos;)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSlug(val.toLowerCase().replaceAll(/[^a-z0-9-]/g, '-').replaceAll(/-+/g, '-').replaceAll(/^-|-$/g, ''));
                    }}
                    placeholder="about-us"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500 -mt-3">
                  Slug is immutable after creation. Use lowercase letters, numbers, and hyphens only.
                </p>
              </>
            )}

            {!isCreating && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Slug (Immutable)</div>
                <p className="text-sm text-gray-600 font-mono mt-1">{slug}</p>
                <p className="text-xs text-gray-500 mt-1">Slug cannot be changed after creation</p>
              </div>
            )}

            {isCreating && (
              <AdminInput
                label="Page Name*"
                value={pageName}
                onChange={setPageName}
              />
            )}

            {!isCreating && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Page Name</div>
                <p className="text-sm text-gray-600 mt-1">{pageName}</p>
              </div>
            )}

            <AdminInput
              label="Meta Title*"
              value={metaTitle}
              onChange={setMetaTitle}
            />

            <AdminTextarea
              label="Meta Description*"
              value={metaDescription}
              onChange={setMetaDescription}
              rows={4}
            />

            <AdminTextarea
              label="Meta Keywords*"
              value={metaKeywords}
              onChange={setMetaKeywords}
              rows={3}
            />

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setOpenModal(false);
                  setIsCreating(false);
                  setSelectedSlug(null);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg shadow"
              >
                {isCreating ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
