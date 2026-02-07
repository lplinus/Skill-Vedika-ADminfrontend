"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/utils/axios";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { FaTrash, FaGripVertical, FaPlus, FaSave } from "react-icons/fa";
import { MdOutlineOpenInNew } from "react-icons/md";
import { BannerBox } from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";

interface MenuItem {
  slug: string;
  text: string;
  new_tab: boolean;
}

interface HeaderSettings {
  id: number;
  logo?: string; // Legacy: full URL (for backward compatibility)
  logo_public_id?: string; // New: Cloudinary public_id (preferred)
  menu_items: MenuItem[];
  created_at?: string;
  updated_at?: string;
}

export default function HeaderSettingsPage() {
  const [settings, setSettings] = useState<HeaderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load header settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/header-settings");
      setSettings(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to load header settings:", err);
      toast.error("Failed to load header settings");
      // Initialize with defaults
      setSettings({
        id: 1,
        logo: "",
        menu_items: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const handleLogoChange = (publicId: string) => {
    if (settings) {
      console.log("Logo public_id changed to:", publicId);
      // Store public_id instead of full URL
      setSettings({ ...settings, logo_public_id: publicId, logo: undefined });
    }
  };

  const handleMenuItemUpdate = (
    index: number,
    field: keyof MenuItem,
    value: string | boolean
  ) => {
    if (settings) {
      const updated = [...settings.menu_items];
      updated[index] = { ...updated[index], [field]: value };
      setSettings({ ...settings, menu_items: updated });
    }
  };

  const handleMenuItemDelete = (index: number) => {
    if (settings) {
      setSettings({
        ...settings,
        menu_items: settings.menu_items.filter((_, i) => i !== index),
      });
    }
  };

  const handleAddMenuItem = () => {
    if (settings) {
      setSettings({
        ...settings,
        menu_items: [
          ...settings.menu_items,
          { slug: "/", text: "New Item", new_tab: false },
        ],
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index && settings) {
      const items = [...settings.menu_items];
      const draggedItem = items[draggedIndex];
      items.splice(draggedIndex, 1);
      items.splice(index, 0, draggedItem);
      setSettings({ ...settings, menu_items: items });
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);

    const payload = {
      logo_public_id: settings.logo_public_id || settings.logo, // Use public_id if available, fallback to logo for backward compatibility
      menu_items: settings.menu_items,
    };

    console.log("Saving header settings with payload:", payload);

    try {
      const response = await api.post("/header-settings", payload);
      
      console.log("Server response:", response.data);
      
      // Update state with the server's response data to ensure consistency
      if (response.data.data) {
        setSettings(response.data.data);
      }
      
      toast.success("Header settings updated successfully!");
    } catch (error) {
      console.error("Failed to save header settings:", error);
      let errorMessage = "Failed to save header settings";
      if (isAxiosError(error)) {
        const respData = error.response?.data as
          | { message?: string; error?: string }
          | undefined;
        errorMessage = respData?.message || respData?.error || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading header settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-600">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full">
      {/* Page Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        Header Settings
      </h1>

      <div className="space-y-6">
        {/* Logo Section */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
            Logo
          </h2>

          <div className="space-y-3">
            <BannerBox
              label="Upload Logo"
              image={settings.logo_public_id || settings.logo}
              onUpload={(publicId: string) => handleLogoChange(publicId)}
              iconSize={18}
            />

            <p className="text-xs text-gray-500">
              Upload a logo image. This will be stored using Cloudinary.
            </p>
          </div>
        </div>

        {/* Menu Items Section */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Navigation Menu Items
            </h2>

            <button
              onClick={handleAddMenuItem}
              className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer transition flex items-center gap-2 disabled:opacity-"
            >
              <FaPlus size={14} />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {settings.menu_items.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition ${
                  draggedIndex === index ? "opacity-50" : ""
                }`}
              >
                {/* Drag handle */}
                <div className="cursor-grab text-gray-400 hover:text-gray-600">
                  <FaGripVertical size={20} />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Menu Text
                    </label>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) =>
                        handleMenuItemUpdate(index, "text", e.target.value)
                      }
                      placeholder="Menu item name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      Slug / URL
                    </label>
                    <input
                      type="text"
                      value={item.slug}
                      onChange={(e) =>
                        handleMenuItemUpdate(index, "slug", e.target.value)
                      }
                      placeholder="/page-url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* New tab + delete */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.new_tab}
                      onChange={(e) =>
                        handleMenuItemUpdate(index, "new_tab", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <MdOutlineOpenInNew size={16} className="text-gray-600" />
                    <span className="text-gray-700">New Tab</span>
                  </label>

                  <button
                    onClick={() => handleMenuItemDelete(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            ))}

            {settings.menu_items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No menu items yet. Click “Add Item” to create one.
              </div>
            )}
          </div>
        </div>

        {/* Save Button — aligned RIGHT */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg cursor-pointer transition flex items-center gap-2 disabled:opacity-"
          >
            <FaSave size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Last Updated */}
        {settings.updated_at && (
          <div className="text-sm text-gray-500">
            Last updated: {new Date(settings.updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
