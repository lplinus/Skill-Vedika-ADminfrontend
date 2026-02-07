"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/utils/axios";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { BannerBox } from "@/app/dashboard/AllPages/CorporateTraining/components/AdminUI";

interface AdminProfile {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);


  // Fetch admin profile from backend
  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Authentication is handled via HTTP-only cookies automatically
      // No need to attach tokens manually
      const res = await api.get("/admin/profile");
      const data = res.data.data || res.data;
      setProfile(data);
      setName(data.name || "");
      setEmail(data.email || "");
      setAvatar(data.avatar || "");
      // persist avatar for header
      try {
        if (globalThis.window !== undefined) {
          globalThis.window.localStorage.setItem(
            "admin_avatar",
            data.avatar || ""
          );
          globalThis.window.dispatchEvent(
            new CustomEvent("admin:profileUpdated", {
              detail: { avatar: data.avatar || "" },
            })
          );
        }
      } catch (error_) {
        // Storage or event dispatch failed - log in development only
        if (process.env.NODE_ENV === "development") {
          console.debug("Failed to persist avatar:", error_);
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      // If unauthorized, give a clearer message
      if (isAxiosError(err) && err.response?.status === 401) {
        toast.error("Unauthenticated. Please login.");
      }
      setName("");
      setEmail("");
      setAvatar("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  // Handle avatar upload - update immediately in header
  const handleAvatarUpload = (url: string) => {
    setAvatar(url);
    // Update header immediately when avatar is uploaded (before saving)
    try {
      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.setItem("admin_avatar", url || "");
        globalThis.window.dispatchEvent(
          new CustomEvent("admin:profileUpdated", {
            detail: { avatar: url || "" },
          })
        );
      }
    } catch (error_) {
      // Storage or event dispatch failed - log in development only
      if (process.env.NODE_ENV === "development") {
        console.debug("Failed to update avatar in header:", error_);
      }
    }
  };

  // Authentication is handled via HTTP-only cookies, no token storage needed

  // Helper: Persist avatar to localStorage and notify header
  const persistAvatar = (avatarUrl: string): void => {
    try {
      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.setItem("admin_avatar", avatarUrl);
        globalThis.window.dispatchEvent(
          new CustomEvent("admin:profileUpdated", {
            detail: { avatar: avatarUrl },
          })
        );
      }
    } catch (error_) {
      // Storage or event dispatch failed - log in development only
      if (process.env.NODE_ENV === "development") {
        console.debug("Failed to persist avatar:", error_);
      }
    }
  };

  // Helper: Ensure CSRF cookie is present
  const ensureCsrfCookie = async (): Promise<void> => {
    try {
      await api.get("/sanctum/csrf-cookie");
    } catch (error_) {
      // Interceptor will handle failures, but this improves reliability
      if (process.env.NODE_ENV === "development") {
        console.debug("CSRF cookie fetch failed (continuing):", error_);
      }
    }
  };

  // Helper: Build request config (authentication via HTTP-only cookies)
  const buildRequestConfig = (): {
    withCredentials: boolean;
  } => {
    return { withCredentials: true }; // Cookies are sent automatically
  };

  // Helper: Handle successful profile update
  const handleUpdateSuccess = (
    returned: unknown,
    currentProfile: AdminProfile | null
  ): void => {
    const profileData = returned as
      | { id?: number; name?: string; email?: string; avatar?: string }
      | undefined;
    const newProfile: AdminProfile = {
      id: profileData?.id ?? currentProfile?.id ?? 0,
      name: profileData?.name ?? name,
      email: profileData?.email ?? email,
      avatar: profileData?.avatar ?? avatar,
    };
    setProfile(newProfile);
    setPassword("");
    toast.success("Profile updated successfully!");
    const newAvatar = profileData?.avatar ?? avatar ?? "";
    persistAvatar(newAvatar);
  };

  // Helper: Handle save error
  const handleSaveError = (error: unknown): void => {
    console.error("Failed to save profile:", error);
    if (isAxiosError(error)) {
      // Log server response in development
      if (process.env.NODE_ENV === "development" && error.response) {
        try {
          console.error(
            "Server response:",
            JSON.stringify(error.response.data)
          );
        } catch {
          // Ignore stringify errors
        }
      }
      if (error.response?.status === 401) {
        toast.error("Unauthenticated. Please login.");
        return;
      }
      const respData = error.response?.data as
        | { message?: string; error?: string }
        | undefined;
      const errorMessage =
        respData?.message ?? respData?.error ?? "Failed to save profile";
      toast.error(errorMessage);
    } else {
      toast.error("Failed to save profile");
    }
  };

  // Save profile with avatar
  const handleSave = async (): Promise<void> => {
    if (!name || !email) {
      toast.error("Name and email are required");
      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, string> = {
        name,
        email,
      };

      if (avatar) {
        payload.avatar = avatar;
      }

      if (password) {
        payload.password = password;
      }

      await ensureCsrfCookie();
      const config = buildRequestConfig();
      const res = await api.post("/admin/update", payload, config);

      // Backend returns: { status: true, data: $admin, token: $token }
      // Token is in HTTP-only cookie, no need to store it
      if (res.data.status === true || res.status === 200) {
        const returned = res.data.data ?? res.data.user ?? res.data;
        handleUpdateSuccess(returned, profile);
      }
    } catch (error) {
      handleSaveError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1A3F66] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600 font-medium">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Avatar Preview Card - Header Style */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#1A3F66] px-6 py-8 flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white/40 shadow-lg overflow-hidden">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Profile Picture
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a new profile picture. This will appear in the header and
            across your account.
          </p>
          <BannerBox
            label="Upload Profile Avatar"
            image={avatar}
            onUpload={handleAvatarUpload}
          />
        </div>
      </div>

      {/* Profile Information Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Account Information
          </h2>
          <p className="text-sm text-gray-600">
            Update your personal details and account settings
          </p>
        </div>

        <div className="space-y-5">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="text-sm font-semibold text-gray-700 block mb-2"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] transition outline-none"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="text-sm font-semibold text-gray-700 block mb-2"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66] transition outline-none"
              placeholder="Enter your email address"
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="text-sm font-semibold text-gray-700 block mb-2"
            >
              New Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg
                 focus:ring-2 focus:ring-[#1A3F66] focus:border-[#1A3F66]
                 transition outline-none"
                placeholder="Leave empty to keep current password"
              />

              {/* Eye Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500
                 hover:text-[#1A3F66] transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Leave this field empty if you don&apos;t want to change your
              password
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-[#1A3F66] hover:bg-blue-800 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
