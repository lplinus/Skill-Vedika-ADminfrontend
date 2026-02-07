"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Read text and attempt to parse JSON (handle HTML errors gracefully)
      const text = await res.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (res.ok) {
        toast.success((parsed && parsed.message) || "Password reset link sent to your email!");
        // Optionally show reset URL in dev
        if (parsed && parsed.reset_url) {
          console.debug("Reset URL:", parsed.reset_url);
        }
      } else {
        const msg = parsed && (parsed.message || parsed.error) ? (parsed.message || parsed.error) : text || "Email not found";
        toast.error(String(msg));
      }
    } catch (err) {
      toast.error("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen flex items-center justify-center bg-[#0F1E33] px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl">
          <h2 className="text-2xl font-bold text-center text-[#1A3F66]">
            Reset Password
          </h2>

          <p className="text-center text-gray-500 mt-2 mb-6">
            Enter your email to receive reset instructions
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                required
                placeholder="admin@gmail.com"
                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-[#1A3F66] text-white py-3 rounded-lg shadow-md hover:bg-[#244f88] transition"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
