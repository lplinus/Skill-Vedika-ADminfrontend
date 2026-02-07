"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/utils/axios";
import { FiSearch } from "react-icons/fi";
import { FaEdit, FaTrash, FaPlus, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { AdminInput, AdminTextarea } from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";

interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  question_count: number;
  show: boolean;
  created_at: string;
  updated_at: string;
}

export default function AllIQsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [show, setShow] = useState(true);

  // -------------------------------------------
  // LOAD ALL CATEGORIES
  // -------------------------------------------
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/interview-question-categories-admin");
      if (res.status === 200) {
        setCategories(res.data.data || []);
      } else {
        setError("Failed to load categories");
      }
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      setError(err?.response?.data?.message || "Failed to load categories");
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // -------------------------------------------
  // OPEN EDIT MODAL
  // -------------------------------------------
  const openEditModal = useCallback(async (id: number) => {
    try {
      const category = categories.find((c) => c.id === id);
      if (!category) return;

      setSelectedId(id);
      setIsCreating(false);
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || "");
      setShow(category.show);
      setOpenModal(true);
    } catch (err) {
      toast.error("Failed to load category");
    }
  }, [categories]);

  // -------------------------------------------
  // OPEN CREATE MODAL
  // -------------------------------------------
  const openCreateModal = useCallback(() => {
    setSelectedId(null);
    setIsCreating(true);
    setName("");
    setSlug("");
    setDescription("");
    setShow(true);
    setOpenModal(true);
  }, []);

  // -------------------------------------------
  // SAVE (CREATE OR UPDATE)
  // -------------------------------------------
  const handleSave = useCallback(async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    // Validate slug format (lowercase, hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      toast.error("Slug must be lowercase, with only letters, numbers, and hyphens");
      return;
    }

    try {
      if (isCreating) {
        const res = await api.post("/interview-question-categories", {
          name,
          slug,
          description,
          show,
        });

        if (res.status === 201) {
          toast.success("Category created successfully");
          setOpenModal(false);
          fetchCategories();
        }
      } else if (selectedId) {
        const res = await api.put(`/interview-question-categories/${selectedId}`, {
          name,
          slug,
          description,
          show,
        });

        if (res.status === 200) {
          toast.success("Category updated successfully");
          setOpenModal(false);
          fetchCategories();
        }
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err?.response?.data?.message || "Failed to save category");
    }
  }, [isCreating, selectedId, name, slug, description, show, fetchCategories]);

  // -------------------------------------------
  // DELETE
  // -------------------------------------------
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this category? All questions in this category will also be deleted.")) {
      return;
    }

    try {
      const res = await api.delete(`/interview-question-categories/${id}`);
      if (res.status === 200) {
        toast.success("Category deleted successfully");
        fetchCategories();
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err?.response?.data?.message || "Failed to delete category");
    }
  }, [fetchCategories]);

  // Filter categories
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Interview Question Categories</h1>
            <p className="text-gray-600 mt-1">Manage interview question categories</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus /> Add Category
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading categories...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No categories found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Slug</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Questions</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{category.id}</td>
                    <td className="py-3 px-4 font-medium">{category.name}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-sm">{category.slug}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-xs">
                      {category.description || "—"}
                    </td>
                    <td className="py-3 px-4">{category.question_count}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          category.show ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {category.show ? "Visible" : "Hidden"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(category.id)}
                          className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {isCreating ? "Create Category" : "Edit Category"}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <AdminInput
                label="Name *"
                value={name}
                onChange={(val) => setName(val)}
                placeholder="e.g., Python"
              />

              <AdminInput
                label="Slug *"
                value={slug}
                onChange={(val) => setSlug(val.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="e.g., python"
                disabled={!isCreating}
              />

              <AdminTextarea
                label="Description"
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="Category description..."
                rows={4}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show"
                  checked={show}
                  onChange={(e) => setShow(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="show" className="text-sm text-gray-700">
                  Show on website
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isCreating ? "Create" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

