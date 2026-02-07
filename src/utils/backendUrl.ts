/**
 * Get the backend base URL (without /api suffix)
 * Handles both cases:
 * - NEXT_PUBLIC_API_URL = https://api.skillvedika.in (without /api)
 * - NEXT_PUBLIC_API_URL = https://api.skillvedika.in/api (with /api)
 */
export function getBackendBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  // Remove /api suffix if present to avoid double /api/api
  return apiUrl.replace(/\/api\/?$/, '');
}

/**
 * Get the full backend URL for an API endpoint
 * @param endpoint - API endpoint path (e.g., '/api/admin/login')
 */
export function getBackendUrl(endpoint: string): string {
  const baseUrl = getBackendBaseUrl();
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

