"use client";

import { useState, useEffect, useCallback } from "react";
import { useMemo } from "react";
import useDebounce from "@/utils/useDebounce";
import { FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import {api} from "@/utils/axios";
import { isAxiosError } from "axios";

type Category = {
  id: number;
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function AllCategories() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Fetch categories
  // Fetch categories from backend using axios instance (respects baseURL & auth)
  type ResponseError = {
    message?: string;
    error?: string;
    errors?: Record<string, string[]>;
  };
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get<Category[]>("/categories");
      setCategories(res.data || []);
    } catch (err: unknown) {
      console.error("fetchCategories error:", err);
      let message = "Failed to load categories.";
      if (isAxiosError(err)) {
        const data = err.response?.data as ResponseError | undefined;
        message = data?.message || data?.error || err.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    // schedule fetch on next tick to avoid synchronous setState inside effect
    const timer = setTimeout(() => {
      void fetchCategories();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCategories]);

  // Add category
  const addCategory = async () => {
    if (!newCategoryName.trim())
      return toast.error("Category name is required.");

    try {
      // Ensure CSRF cookie is present for stateful requests (Sanctum)
      try {
        await fetch("/api/sanctum/csrf-cookie", { credentials: "include" });
      } catch {
        // interceptor will also attempt if this fails
      }

      // Use proxied protected endpoint (Next API -> backend /api/categories)
      const res = await api.post("/categories", { name: newCategoryName });
      toast.success("Category added!");
      setNewCategoryName("");
      setIsModalOpen(false);
      // prepend new category if returned, else refetch
      const created: Category | undefined = res.data?.id
        ? {
            id: res.data.id,
            name: newCategoryName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : undefined;
      if (created) setCategories((prev) => [created, ...prev]);
      else fetchCategories();
    } catch (err: unknown) {
      console.error("addCategory error:", err);
      if (isAxiosError(err)) {
        const data = err.response?.data as ResponseError | undefined;
        if (err.response?.status === 401) {
          toast.error("Unauthenticated. Please login to add categories.");
          return;
        }
        toast.error(
          data?.message ||
            data?.error ||
            err.message ||
            "Failed to add category."
        );
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to add category.");
      }
    }
  };

  // Update category
  const updateCategory = async (id: number) => {
    if (!editName.trim()) return toast.error("Name cannot be empty.");

    try {
      // Ensure CSRF cookie
      try {
        await fetch("/api/sanctum/csrf-cookie", { credentials: "include" });
      } catch {}

      // Update via proxied protected endpoint
      await api.put(`/categories/${id}`, { name: editName });
      toast.success("Updated successfully!");
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id
            ? { ...cat, name: editName, updated_at: new Date().toISOString() }
            : cat
        )
      );
      setEditingId(null);
      setEditName("");
    } catch (err: unknown) {
      console.error("updateCategory error:", err);
      let message = "Update failed.";
      if (isAxiosError(err)) {
        const data = err.response?.data as ResponseError | undefined;
        if (err.response?.status === 401) {
          toast.error("Unauthenticated. Please login to update categories.");
          return;
        }
        message = data?.message || data?.error || err.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
    }
  };

  // Delete category
  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category?")) return;

    try {
      // Delete via proxied protected endpoint
      try {
        await fetch("/api/sanctum/csrf-cookie", { credentials: "include" });
      } catch {}
      await api.delete(`/categories/${id}`);
      toast.success("Deleted!");
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err: unknown) {
      console.error("deleteCategory error:", err);
      if (isAxiosError(err) && err.response?.status === 401) {
        toast.error("Unauthenticated. Please login to delete categories.");
      } else {
        const data = isAxiosError(err)
          ? (err.response?.data as ResponseError | undefined)
          : undefined;
        const message =
          data?.message ||
          (err instanceof Error ? err.message : "Delete failed.");
        toast.error(message);
      }
    }
  };

  // Search logic
  const filtered = categories.filter((cat) =>
    (cat.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-200">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          All Categories
        </h2>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            Add New Category
          </button>

          <input
            type="text"
            placeholder="Search category..."
            className="px-4 py-2 rounded-xl border border-gray-300 shadow-sm w-64 bg-white focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-3xl border border-gray-200 shadow-sm bg-white/80">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100/60 backdrop-blur-xl">
              {["ID", "Name", "Created", "Updated", "Actions"].map((title) => (
                <th
                  key={title}
                  className="py-4 px-6 text-sm font-semibold text-gray-700 border-b"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50 transition">
                <td className="py-4 px-6 font-semibold">{cat.id}</td>

                <td className="py-4 px-6">
                  {editingId === cat.id ? (
                    <input
                      className="border rounded-lg px-3 py-2 w-60"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    cat.name
                  )}
                </td>

                <td className="py-4 px-6">
                  {cat.created_at
                    ? new Date(cat.created_at).toLocaleString()
                    : "N/A"}
                </td>
                <td className="py-4 px-6">
                  {cat.updated_at
                    ? new Date(cat.updated_at).toLocaleString()
                    : "N/A"}
                </td>

                <td className="py-4 px-6">
                  <div className="flex gap-3 justify-center">
                    {editingId === cat.id ? (
                      <>
                        <button
                          className="p-2 bg-green-100 text-green-700 rounded-xl cursor-pointer"
                          onClick={() => updateCategory(cat.id)}
                        >
                          <FaCheck />
                        </button>
                        <button
                          className="p-2 bg-gray-200 text-gray-600 rounded-xl cursor-pointer"
                          onClick={() => {
                            setEditingId(null);
                            setEditName("");
                          }}
                        >
                          <FaTimes />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="p-2 bg-yellow-100 text-yellow-700 rounded-xl cursor-pointer"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditName(cat.name);
                          }}
                        >
                          <FaEdit />
                        </button>

                        <button
                          className="p-2 bg-red-100 text-red-600 rounded-xl cursor-pointer"
                          onClick={() => deleteCategory(cat.id)}
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add New Category</h3>

            <input
              type="text"
              placeholder="Category name"
              className="w-full p-3 border rounded-xl mb-4"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>

              <button
                className="px-5 py-2 rounded-xl bg-[#1A3F66] text-white hover:bg-blue-800 cursor-pointer"
                onClick={addCategory}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
