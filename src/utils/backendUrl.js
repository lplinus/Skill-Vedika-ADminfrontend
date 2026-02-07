/**
 * Utility function to construct backend API URLs correctly
 * Handles both cases:
 * 1. BACKEND_URL ends with /api -> removes it
 * 2. BACKEND_URL doesn't end with /api -> uses as is
 * 
 * @param {string} endpoint - The API endpoint (e.g., "/api/leads" or "/api/admin/login")
 * @returns {string} The full backend URL
 */
export function getBackendUrl(endpoint) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  
  // Remove /api from end if present, otherwise use as is
  const baseUrl = BACKEND_URL.endsWith('/api') 
    ? BACKEND_URL.slice(0, -4)  // Remove '/api' from end
    : BACKEND_URL.replace(/\/api$/, ''); // Remove '/api' only if at end
  
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  
  return baseUrl + cleanEndpoint;
}

