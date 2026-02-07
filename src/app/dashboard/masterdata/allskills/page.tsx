"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import useDebounce from "@/utils/useDebounce";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import { api } from "@/utils/axios";

const API = "/skills";

interface Skill {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

export default function AllSkills() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDescription, setNewSkillDescription] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");

  // Fetch skills
  // const fetchSkills = useCallback(async () => {
  //   try {
  //     const res = await api.get(API);
  //     const data = res.data;

  //     let items: Skill[] = [];
  //     if (Array.isArray(data)) {
  //       items = data;
  //     } else if (data && Array.isArray(data.data)) {
  //       items = data.data;
  //     } else if (data && Array.isArray(data.body)) {
  //       items = data.body;
  //     }

  //     setSkills(items);
  //   } catch (err) {
  //     console.error("Failed to load skills:", err);
  //     toast.error("Failed to load skills.");
  //   }
  // }, []);

  const fetchSkills = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await api.get(API, { signal });

        const data = res.data;
        let items: Skill[] = [];

        if (Array.isArray(data)) items = data;
        else if (Array.isArray(data?.data)) items = data.data;
        else if (Array.isArray(data?.body)) items = data.body;

        setSkills(items);
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          console.log("Fetch skills aborted");
          return;
        }

        console.error("Failed to load skills:", err);
        toast.error("Failed to load skills.");
      }
    },
    []
  );


  useEffect(() => {
    const controller = new AbortController();
  
    const loadSkills = async () => {
      await fetchSkills(controller.signal);
    };
  
    loadSkills();
  
    return () => {
      controller.abort();
    };
  }, [fetchSkills]);

  // Add skill
  const addSkill = async () => {
    if (!newSkillName.trim()) return toast.error("Skill name is required.");

    // Client-side duplicate prevention (case-insensitive)
    const exists = skills.some(
      (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (exists) return toast.error("Duplicate skills are not allowed.");

    try {
      const res = await api.post(API, {
        name: newSkillName.trim(),
        description: newSkillDescription.trim() || null,
        category: newSkillCategory.trim() || null,
      });

      // Handle different response formats: { skill: {...} } or { message: '...', skill: {...} }
      const data = res.data;
      const skill = (data.skill ?? data.data ?? data) as Skill;
      if (!skill?.id) {
        console.error("Invalid response format:", data);
        return toast.error("Invalid response from server. Please try again.");
      }

      setNewSkillName("");
      setNewSkillDescription("");
      setNewSkillCategory("");
      setIsModalOpen(false);
      toast.success("Skill added successfully!");
      // Refresh the skills list to ensure consistency
      await fetchSkills();
    } catch (err: unknown) {
      console.error("Error adding skill:", err);
      const error = err as { response?: { data?: { errors?: Record<string, string[]>, message?: string } } };
      const errors = error.response?.data?.errors;
      const message = error.response?.data?.message;
      toast.error(
        errors?.name?.[0] || message || "Failed to add skill."
      );
    }
  };

  // Update skill
  const updateSkill = async (id: number) => {
    if (!editName.trim()) return toast.error("Skill name is required.");

    // Prevent duplicate skill name among other skills
    const exists = skills.some(
      (s) =>
        s.id !== id && s.name.toLowerCase() === editName.trim().toLowerCase()
    );
    if (exists) return toast.error("Duplicate skills are not allowed.");

    try {
      const res = await api.put(`${API}/${id}`, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        category: editCategory.trim() || null,
      });

      // Handle different response formats: { skill: {...} } or { message: '...', skill: {...} }
      const data = res.data;
      const skill = (data.skill ?? data.data ?? data) as Skill;
      if (!skill?.id) {
        console.error("Invalid response format:", data);
        return toast.error("Invalid response from server. Please try again.");
      }

      setEditingId(null);
      toast.success("Skill updated successfully!");
      // Refresh the skills list to ensure consistency
      await fetchSkills();
    } catch (err: unknown) {
      console.error("Error updating skill:", err);
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message;
      toast.error(message || "Error updating skill.");
    }
  };

  // Delete skill
  const deleteSkill = async (id: number) => {
    // Use a proper confirmation dialog
    const confirmed = globalThis.confirm("Delete this skill?");
    if (!confirmed) return;

    try {
      await api.delete(`${API}/${id}`);
      setSkills(skills.filter((s) => s.id !== id));
      toast.success("Skill deleted successfully!");
      // Refresh the skills list to ensure consistency
      await fetchSkills();
    } catch (err: unknown) {
      console.error("Error deleting skill:", err);
      const error = err as { response?: { data?: { message?: string } } };
      const message = error.response?.data?.message;
      toast.error(message || "Error deleting skill.");
    }
  };

  const filteredSkills = useMemo(
    () =>
      skills.filter((skill) =>
        skill.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      ),
    [skills, debouncedSearchTerm]
  );

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl border border-gray-200">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {/* LEFT */}
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            All Skills
          </h2>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#1A3F66] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl shadow-sm transition whitespace-nowrap"
            >
              Add New Skill
            </button>

            <input
              type="text"
              placeholder="Search skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 shadow-sm bg-white w-64 focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
            />
          </div>
        </div>
      </div>


      {/* TABLE */}
      <div className="overflow-x-auto rounded-3xl border border-gray-200 shadow-sm bg-white/80 backdrop-blur-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100/60 backdrop-blur-xl">
              {[
                "Skill ID",
                "Skill Name",
                "Category",
                "Created",
                "Updated",
                "Actions",
              ].map((heading) => (
                <th
                  key={heading}
                  className="py-4 px-6 font-semibold text-gray-700 border-b border-gray-200"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredSkills.length > 0 ? (
              filteredSkills.map((skill, index) => (
                <tr
                  key={skill.id}
                  className={`transition-all ${index % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                    } hover:bg-gray-50/70 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-[1px] duration-200`}
                >
                  <td className="py-4 px-6 text-gray-900 font-semibold">
                    {skill.id}
                  </td>
                  <td className="py-4 px-6 text-gray-800">{skill.name}</td>
                  <td className="py-4 px-6 text-gray-700">
                    {skill.category ?? "-"}
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {new Date(skill.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {new Date(skill.updated_at).toLocaleDateString()}
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => {
                          setEditingId(Number(skill.id));
                          setEditName(skill.name);
                          setEditDescription(skill.description ?? "");
                          setEditCategory(skill.category ?? "");
                        }}
                        className="p-2 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-700 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        aria-label={`Edit skill ${skill.name}`}
                      >
                        <FaEdit size={15} />
                      </button>

                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="p-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        aria-label={`Delete skill ${skill.name}`}
                      >
                        <FaTrash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-gray-500 italic bg-gray-50"
                >
                  No skills found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD SKILL MODAL */}
      {
        isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Add New Skill
              </h3>

              <input
                type="text"
                placeholder="Skill Name"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
              />

              <input
                type="text"
                placeholder="Category"
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value)}
                className="w-full px-4 py-3 mb-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
              />

              <textarea
                placeholder="Description (optional)"
                value={newSkillDescription}
                onChange={(e) => setNewSkillDescription(e.target.value)}
                className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                rows={3}
              />

              <div className="flex gap-4">
                <button
                  onClick={addSkill}
                  className="flex-1 bg-[#1A3F66] hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition-all cursor-pointer"
                >
                  Add Skill
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewSkillName("");
                    setNewSkillDescription("");
                    setNewSkillCategory("");
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* EDIT SKILL MODAL */}
      {
        editingId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Edit Skill
              </h3>

              <input
                type="text"
                placeholder="Skill Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
              />

              <input
                type="text"
                placeholder="Category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-4 py-3 mb-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
              />

              <textarea
                placeholder="Description (optional)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300"
                rows={3}
              />

              <div className="flex gap-4">
                <button
                  onClick={() => editingId && updateSkill(editingId)}
                  className="flex-1 bg-[#1A3F66] hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition-all cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
