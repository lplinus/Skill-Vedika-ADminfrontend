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
}

interface Question {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  order: number;
  show: boolean;
  created_at: string;
  updated_at: string;
}

export default function AddNewIQsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState(0);
  const [show, setShow] = useState(true);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  // -------------------------------------------
  // LOAD CATEGORIES
  // -------------------------------------------
  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/interview-question-categories-admin");
      if (res.status === 200) {
        setCategories(res.data.data || []);
        if (res.data.data && res.data.data.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(res.data.data[0].id);
          setCategoryId(res.data.data[0].id);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
    }
  }, [selectedCategoryId]);

  // -------------------------------------------
  // LOAD QUESTIONS
  // -------------------------------------------
  const fetchQuestions = useCallback(async () => {
    if (!selectedCategoryId) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/interview-question-categories/${selectedCategoryId}/questions`);
      if (res.status === 200) {
        setQuestions(res.data.data || []);
      } else {
        setError("Failed to load questions");
      }
    } catch (err: any) {
      console.error("Failed to fetch questions:", err);
      setError(err?.response?.data?.message || "Failed to load questions");
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // -------------------------------------------
  // OPEN EDIT MODAL
  // -------------------------------------------
  const openEditModal = useCallback((q: Question) => {
    setSelectedId(q.id);
    setIsCreating(false);
    setQuestion(q.question);
    setAnswer(q.answer);
    setOrder(q.order);
    setShow(q.show);
    setCategoryId(q.category_id);
    setOpenModal(true);
  }, []);

  // -------------------------------------------
  // OPEN CREATE MODAL
  // -------------------------------------------
  const openCreateModal = useCallback(() => {
    if (!selectedCategoryId) {
      toast.error("Please select a category first");
      return;
    }
    setSelectedId(null);
    setIsCreating(true);
    setQuestion("");
    setAnswer("");
    setOrder(questions.length);
    setShow(true);
    setCategoryId(selectedCategoryId);
    setOpenModal(true);
  }, [selectedCategoryId, questions.length]);

  // -------------------------------------------
  // SAVE (CREATE OR UPDATE)
  // -------------------------------------------
  const handleSave = useCallback(async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    if (!categoryId) {
      toast.error("Category is required");
      return;
    }

    try {
      if (isCreating) {
        const res = await api.post("/interview-questions", {
          category_id: categoryId,
          question,
          answer,
          order,
          show,
        });

        if (res.status === 201) {
          toast.success("Question created successfully");
          setOpenModal(false);
          fetchQuestions();
        }
      } else if (selectedId) {
        const res = await api.put(`/interview-questions/${selectedId}`, {
          category_id: categoryId,
          question,
          answer,
          order,
          show,
        });

        if (res.status === 200) {
          toast.success("Question updated successfully");
          setOpenModal(false);
          fetchQuestions();
        }
      }
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err?.response?.data?.message || "Failed to save question");
    }
  }, [isCreating, selectedId, categoryId, question, answer, order, show, fetchQuestions]);

  // -------------------------------------------
  // DELETE
  // -------------------------------------------
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      const res = await api.delete(`/interview-questions/${id}`);
      if (res.status === 200) {
        toast.success("Question deleted successfully");
        fetchQuestions();
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err?.response?.data?.message || "Failed to delete question");
    }
  }, [fetchQuestions]);

  // Filter questions
  const filteredQuestions = questions.filter((q) =>
    q.question.toLowerCase().includes(search.toLowerCase()) ||
    q.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Interview Questions</h1>
            <p className="text-gray-600 mt-1">Manage interview questions by category</p>
          </div>
          <button
            onClick={openCreateModal}
            disabled={!selectedCategoryId}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              selectedCategoryId
                ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <FaPlus /> Add Question
          </button>
        </div>

        {/* Category Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Category
          </label>
          <select
            value={selectedCategoryId || ""}
            onChange={(e) => {
              const catId = parseInt(e.target.value);
              setSelectedCategoryId(catId);
            }}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        {selectedCategoryId && (
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Table */}
        {!selectedCategoryId ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Please select a category to view questions
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading questions...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No questions found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Question</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Answer</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Order</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q) => (
                    <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{q.id}</td>
                      <td className="py-3 px-4 font-medium max-w-md truncate">{q.question}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm max-w-md truncate">{q.answer}</td>
                      <td className="py-3 px-4">{q.order}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            q.show ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {q.show ? "Visible" : "Hidden"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(q)}
                            className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
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
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {isCreating ? "Create Question" : "Edit Question"}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="p-2 hover:bg-gray-100 rounded cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={categoryId || ""}
                  onChange={(e) => setCategoryId(parseInt(e.target.value))}
                  disabled={!isCreating}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <AdminInput
                label="Question *"
                value={question}
                onChange={(val) => setQuestion(val)}
                placeholder="Enter the question..."
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Answer *
                </label>
                <AdminTextarea
                  value={answer}
                  onChange={(val) => setAnswer(val)}
                  placeholder="Enter the answer..."
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-8">
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
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
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

