"use client";

import { useState, useRef, useEffect } from "react";
// Use native <img> for avatar so changes to the src (including cache-busting)
// are reflected immediately without Next/Image optimization/caching surprises.
// If you prefer Next/Image in production, we can switch back and append a
// cache-busting query param when the avatar changes.
// import Image from "next/image";
import { FaBars, FaTimes, FaUser, FaSignOutAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
// import { api } from "@/utils/axios";
import { logout } from "@/utils/logout";




interface HeaderProps {
  readonly onToggleSidebar: () => void;
  readonly isSidebarOpen: boolean;
}

export default function Header({
  onToggleSidebar,
  isSidebarOpen,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // Start with a deterministic default so server and client markup match.
  // Later we replace it with the value from localStorage on mount.
  const [avatar, setAvatar] = useState<string>("/default-uploads/avatar.jpg");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load avatar from localStorage and listen for profile updates (custom
  // event and storage events so changes reflect across tabs/windows).
  useEffect(() => {
    if (globalThis.window === undefined) return;

    // hydrate from localStorage on mount
    try {
      const stored = globalThis.window.localStorage.getItem("admin_avatar");
      if (stored) setAvatar(stored);
    } catch (error_) {
      // Storage access failed - log in development only
      if (process.env.NODE_ENV === "development") {
        console.debug("Failed to load avatar from localStorage:", error_);
      }
    }

    // Helper: Add cache-busting query to avatar URL
    const addCacheBuster = (url: string): string => {
      if (!url) return url;
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}v=${Date.now()}`;
    };

    // handler for custom event dispatched by Profile page
    const onProfileUpdated = (e: Event) => {
      try {
        const detail = (e as CustomEvent<{ avatar?: string }>).detail;
        const newAvatar =
          detail?.avatar ??
          globalThis.window.localStorage.getItem("admin_avatar") ??
          "/default-uploads/avatar.jpg";
        setAvatar(addCacheBuster(newAvatar));
      } catch (error_) {
        // Event handling failed - log in development only
        if (process.env.NODE_ENV === "development") {
          console.debug("Failed to handle profile update event:", error_);
        }
      }
    };

    // handler for storage events (other tabs/windows)
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "admin_avatar") {
        const newAvatar = ev.newValue ?? "/default-uploads/avatar.jpg";
        setAvatar(addCacheBuster(newAvatar));
      }
    };

    globalThis.window.addEventListener(
      "admin:profileUpdated",
      onProfileUpdated as EventListener
    );
    globalThis.window.addEventListener("storage", onStorage);

    return () => {
      globalThis.window.removeEventListener(
        "admin:profileUpdated",
        onProfileUpdated as EventListener
      );
      globalThis.window.removeEventListener("storage", onStorage);
    };
  }, []);

  /* =====================================================
     LOGOUT HANDLER
  ===================================================== */
  // const handleLogout = async () => {
  //   setIsMenuOpen(false);

  //   try {
  //     if (globalThis.window !== undefined) {
  //       globalThis.window.localStorage.removeItem("admin_avatar");
  //     }
  //   } catch {}

  //   try {
  //     // Use the configured api instance which handles cookies and CSRF automatically
  //     // This goes through the Next.js proxy route at /api/admin/logout/route.js
  //     // baseURL is "/api", so this becomes "/api/admin/logout"
  //     console.log("[Header.tsx] Calling logout endpoint: /admin/logout (will become /api/admin/logout)");
  //     const response = await api.post("/admin/logout");
  //     console.log("[Header.tsx] Logout response received:", response.status, response.data);
  //   } catch (error: any) {
  //     // Log error in development, but proceed with logout anyway
  //     console.error("[Header.tsx] Logout error:", error?.response?.status, error?.response?.data || error?.message);
  //     if (process.env.NODE_ENV === "development") {
  //       console.error("Failed to logout:", error);
  //     }
  //   }
  //   console.log("[Header.tsx] Logout process completed, redirecting...");
  //   router.push("/?logout=1");
  // };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout(router);
  };
  
  return (
    <header
      className={`fixed top-0 ${
        isSidebarOpen ? "left-64" : "left-0"
      } right-0 h-16 flex items-center justify-between px-6 shadow-lg transition-all duration-300 z-30`}
      style={{
        background: "#1A3F66",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-2xl text-white cursor-pointer hover:text-gray-200"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? (
            <FaBars className="transition" />
          ) : (
            <FaTimes className="rotate-90 transition" />
          )}
        </button>

        <h1 className="text-xl font-semibold text-white">SkillVedika</h1>
      </div>

      {/* RIGHT */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full cursor-pointer"
          aria-label="Toggle user menu"
          aria-expanded={isMenuOpen}
        >
          <img
            src={avatar || "/default-uploads/avatar.jpg"}
            alt="Admin Avatar"
            className="w-10 h-10 rounded-full border-2 border-white/40 cursor-pointer hover:scale-105 transition object-cover"
          />
        </button>

        {/* DROPDOWN MENU */}
        {isMenuOpen && (
          <div
            className="absolute right-0 mt-3 w-48 rounded-xl shadow-xl py-2 bg-white border border-gray-200"
            style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}
          >
            <button
              onClick={() => {
                setIsMenuOpen(false);
                router.push("/dashboard/Profile");
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <FaUser className="mr-2 text-[#1A3F66]" /> Profile
            </button>

            <div className="my-1 border-t border-gray-100"></div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <FaSignOutAlt className="mr-2 text-red-500" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
