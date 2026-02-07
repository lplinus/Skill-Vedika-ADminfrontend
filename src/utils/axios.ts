import axios from "axios";
import toast from "react-hot-toast";




/* =====================================================
   ROOT BACKEND URL (NO /api)
===================================================== */
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* =====================================================
   SANCTUM (CSRF COOKIE)
===================================================== */
export const apiSanctum = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // 🔥 REQUIRED
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  // timeout: 10000, // ⬅️ add this (important)
  headers: {
    Accept: "application/json",
  },
});

/* =====================================================
   API (AUTHENTICATED ROUTES)
===================================================== */
export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true, // 🔥 REQUIRED
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  // timeout: 10000, // ⬅️ add this (important)
  headers: {
    Accept: "application/json",
  },
});

/* =====================================================
   CSRF INTERCEPTOR (SANCTUM SPA MODE)
===================================================== */
api.interceptors.request.use(async (config) => {
  if (typeof window === "undefined") return config;

  const method = (config.method || "get").toLowerCase();
  const needsCsrf = !["get", "head", "options"].includes(method);

  if (needsCsrf) {
    // Ensure CSRF cookie exists
    if (!document.cookie.includes("XSRF-TOKEN")) {
      await apiSanctum.get("/sanctum/csrf-cookie");
    }

    // Attach X-XSRF-TOKEN header (important)
    const token = document.cookie
      .split("; ")
      .find((c) => c.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];

    if (token && config.headers) {
      config.headers["X-XSRF-TOKEN"] = decodeURIComponent(token);
    }
  }

  return config;
});

/* =====================================================
   GLOBAL 401 HANDLER
===================================================== */
let sessionToastShown = false;

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;

    if (typeof window !== "undefined" && status === 401) {
      if (!sessionToastShown) {
        sessionToastShown = true;
        toast.error("Session expired. Please log in again.");
      }
    }

    return Promise.reject(error);
  }
);



