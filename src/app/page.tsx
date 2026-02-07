"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import { api, apiSanctum } from "@/utils/axios";

function LoginPageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================================
     SHOW LOGOUT TOAST (ONCE)
  ================================= */
  useEffect(() => {
    if (params.get("logout") === "1") {
      if (!sessionStorage.getItem("logout_toast")) {
        toast.success("Logged out successfully");
        sessionStorage.setItem("logout_toast", "yes");
        history.replaceState({}, "", "/");
      }
    }
  }, [params]);

  /* ================================
     HANDLE LOGIN (SANCTUM SPA)
  ================================= */
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // 1️⃣ Get CSRF cookie (MANDATORY for Sanctum)
      await apiSanctum.get("/sanctum/csrf-cookie");

      // 2️⃣ Login request (SESSION-based)
      const res = await api.post("/admin/login", {
        email: email.trim(),
        password: password.trim(),
      });
      console.log(res);

      // 3️⃣ Store non-sensitive UI data only
      if (res.data?.user?.avatar) {
        sessionStorage.setItem("admin_avatar", res.data.user.avatar);
        window.dispatchEvent(
          new CustomEvent("admin:profileUpdated", {
            detail: { avatar: res.data.user.avatar },
          })
        );
      }

      // 4️⃣ HARD REDIRECT (important for cookie sync)
      window.location.replace("/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Login failed"
      );
      console.error("[Login Error]", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />

      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0F1E33]">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 border-t-4 border-[#1A3F66]">
          <h1 className="text-3xl font-extrabold text-center mb-2 text-[#1A3F66]">
            SkillVedika Admin
          </h1>
          <p className="text-center text-gray-500 mb-6">
            Sign in to continue
          </p>

          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* EMAIL */}
            <div>
              <label className="block font-medium mb-1">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="admin@gmail.com"
                  className="w-full border rounded-lg pl-10 p-3 focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block font-medium mb-1">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full border rounded-lg pl-10 pr-12 p-3 focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span
                  className="absolute right-3 top-3 cursor-pointer text-gray-500"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-[#1A3F66] text-white py-3 rounded-lg font-semibold hover:bg-[#244f88]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiLogIn />
              )}
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F1E33]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
