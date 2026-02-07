// Helper function to get backend URL
const getBackendUrl = (endpoint) => {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const baseUrl = BACKEND_URL.endsWith('/api') 
    ? BACKEND_URL.slice(0, -4)
    : BACKEND_URL.replace(/\/api$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  return baseUrl + cleanEndpoint;
};

/**
 * Proxy route for /api/admin/me
 * 
 * This endpoint verifies authentication status using Laravel Sanctum SPA mode.
 * Sanctum SPA authentication relies on session cookies (laravel_session, XSRF-TOKEN)
 * and does NOT require Bearer tokens.
 * 
 * Behavior:
 * - Forwards all cookies from the incoming request to the backend
 * - Sanctum authenticates via session cookies on the backend
 * - Returns exact backend response (no caching, no modification)
 * - Fails secure: treats backend/network errors as unauthenticated
 */
export async function GET(req) {
  try {
    // Get all cookies from the incoming request
    // Sanctum SPA mode uses session cookies (laravel_session, XSRF-TOKEN, etc.)
    const incomingCookie = req.headers.get("cookie") || "";

    // Build backend URL
    const target = getBackendUrl("/api/admin/me");

    // Forward request to backend with all cookies
    // Sanctum will authenticate using session cookies automatically
    const res = await fetch(target, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(incomingCookie ? { cookie: incomingCookie } : {}),
      },
      credentials: "include", // Include credentials for cookie handling
    });

    // Get response text (may be JSON or empty)
    const text = await res.text();

    // Forward exact status and response from backend
    // NO caching, NO modification - backend is the single source of truth
    try {
      if (text && text.length > 0) {
        const data = JSON.parse(text);
        return new Response(JSON.stringify(data), { 
          status: res.status,
          headers: {
            "Content-Type": "application/json",
          }
        });
      }
      return new Response(null, { status: res.status });
    } catch {
      // If response is not JSON, forward as-is
      return new Response(text || null, { status: res.status });
    }
  } catch (e) {
    // Network error or backend unreachable = treat as unauthenticated (fail secure)
    console.error('[proxy admin/me GET] Backend request failed:', e.message);
    return new Response(
      JSON.stringify({ logged_in: false, message: 'Verification failed' }), 
      { 
        status: 401,
        headers: {
          "Content-Type": "application/json",
        }
      }
    );
  }
}
