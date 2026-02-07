// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// /**
//  * 🔐 SECURITY-HARDENED MIDDLEWARE
//  * 
//  * CRITICAL SECURITY RULES (MUST BE ENFORCED):
//  * 1. NEVER trust cookies alone - cookie presence ≠ authentication
//  * 2. NEVER use localStorage for auth decisions
//  * 3. NEVER cache auth results - verify fresh on EVERY request
//  * 4. Backend is the ONLY source of truth for login status
//  * 5. If backend cannot prove admin is logged in RIGHT NOW → block access
//  * 
//  * This middleware calls /api/admin/me on EVERY route access to verify
//  * current authentication status. No shortcuts. No caching. No trust.
//  */
// // Helper function to get backend URL
// function getBackendUrl(endpoint: string): string {
//   const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
//   const baseUrl = BACKEND_URL.endsWith('/api') 
//     ? BACKEND_URL.slice(0, -4)
//     : BACKEND_URL.replace(/\/api$/, '');
//   const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
//   return baseUrl + cleanEndpoint;
// }

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // CRITICAL: Exclude Next.js internal routes and static files FIRST
//   // These must NEVER be intercepted by middleware
//   if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
//     return NextResponse.next();
//   }
  
//   // Exclude static files by extension
//   const staticFileExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.eot', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
//   if (staticFileExtensions.some(ext => pathname.toLowerCase().endsWith(ext))) {
//     return NextResponse.next();
//   }

//   // ONLY public routes - login and forgot password
//   // These are the ONLY routes that don't require authentication
//   const publicRoutes = ["/", "/forgot-password"];
//   const isPublicRoute = publicRoutes.includes(pathname);

//   // For public routes, verify if user is already logged in
//   // If logged in and on login page → redirect to dashboard
//   if (isPublicRoute) {
//     try {
//       const allCookies = request.headers.get("cookie") || "";
      
//       // Extract auth_token from cookies for Bearer token authentication
//       let authToken = null;
//       if (allCookies) {
//         const cookies = allCookies.split(';').map(c => c.trim());
//         const authCookie = cookies.find(c => c.startsWith('auth_token='));
//         if (authCookie) {
//           const equalIndex = authCookie.indexOf('=');
//           if (equalIndex !== -1) {
//             authToken = authCookie.substring(equalIndex + 1);
//             try {
//               authToken = decodeURIComponent(authToken);
//             } catch (e) {
//               // If decoding fails, use original value
//             }
//           }
//         }
//       }
      
//       // Only verify if auth token exists (optimization)
//       if (authToken) {
//         const backendUrl = getBackendUrl("/api/admin/me");
        
//         const headers: Record<string, string> = {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           Authorization: `Bearer ${authToken}`,
//         };
        
//         if (allCookies) {
//           headers["Cookie"] = allCookies;
//         }
        
//         const response = await fetch(backendUrl, {
//           method: "GET",
//           headers,
//           credentials: "include",
//         });

//         // If logged in and on login page → redirect to dashboard
//         if (response.ok && pathname === "/") {
//           return NextResponse.redirect(new URL("/dashboard", request.url));
//         }
//       }
//     } catch (error) {
//       // If verification fails, allow access to public route
//       // User can still access login page
//       // Error is intentionally ignored - public routes should be accessible
//       if (process.env.NODE_ENV === "development") {
//         console.debug("[Middleware] Public route verification skipped:", error);
//       }
//     }
    
//     return NextResponse.next();
//   }

//   // ============================================================
//   // PROTECT ALL ADMIN ROUTES - VERIFICATION REQUIRED
//   // ============================================================
//   // This includes:
//   // - /dashboard/* (all dashboard pages and sub-routes)
//   // - /about (if it exists)
//   // - ANY other route in the admin panel
//   // 
//   // EVERY route except public ones MUST verify authentication
//   // Call backend to verify CURRENT login status
//   // NO TRUST in cookies, localStorage, or cached state
//   // ============================================================
  
//   try {
//     // Get all cookies from the request for forwarding to backend
//     const allCookies = request.headers.get("cookie") || "";
    
//     // Extract auth_token from cookies for Bearer token authentication
//     // The backend sets auth_token cookie during login, and we use it as Bearer token
//     let authToken = null;
//     if (allCookies) {
//       const cookies = allCookies.split(';').map(c => c.trim());
//       const authCookie = cookies.find(c => c.startsWith('auth_token='));
//       if (authCookie) {
//         const equalIndex = authCookie.indexOf('=');
//         if (equalIndex !== -1) {
//           authToken = authCookie.substring(equalIndex + 1);
//           try {
//             authToken = decodeURIComponent(authToken);
//           } catch (e) {
//             // If decoding fails, use original value
//           }
//         }
//       }
//     }
    
//     // Call backend directly (no proxy) to verify authentication
//     // const backendUrl = getBackendUrl("/api/admin/me");
//     const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}`;
    
//     if (process.env.NODE_ENV === "development") {
//       console.log("[Middleware] Verifying auth for:", pathname);
//       console.log("[Middleware] Backend URL:", backendUrl);
//       console.log("[Middleware] Auth token present:", !!authToken);
//       console.log("[Middleware] Cookies present:", allCookies ? "YES (" + allCookies.length + " chars)" : "NO");
//       if (allCookies) {
//         // Log cookie names (not values for security)
//         const cookieNames = allCookies.split(';').map(c => c.trim().split('=')[0]).filter(Boolean);
//         console.log("[Middleware] Cookie names:", cookieNames.join(', '));
//       }
//     }
    
//     // Build headers with Bearer token and cookies
//     const headers: Record<string, string> = {
//       "Content-Type": "application/json",
//       Accept: "application/json",
//     };
    
//     // Add Bearer token if available
//     if (authToken) {
//       headers["Authorization"] = `Bearer ${authToken}`;
//     }
    
//     // Forward all cookies to backend (for session support if needed)
//     if (allCookies) {
//       headers["Cookie"] = allCookies;
//     }
    
//     const response = await fetch(backendUrl, {
//       method: "GET",
//       headers,
//       credentials: "include", // Include credentials for cookie handling
//     });
    
//     if (process.env.NODE_ENV === "development") {
//       console.log("[Middleware] Backend response status:", response.status);
//       if (!response.ok) {
//         const errorText = await response.text().catch(() => "Could not read error");
//         console.log("[Middleware] Backend error response:", errorText.substring(0, 200));
//       }
//     }

//     // Backend returned 200 = Admin is logged in RIGHT NOW → Allow access
//     if (response.ok) {
//       return NextResponse.next();
//     }

//     // Backend returned 401/403 = Admin is NOT logged in → Block access
//     // Clear any invalid cookie and redirect to login
//     const loginUrl = new URL("/", request.url);
//     loginUrl.searchParams.set("redirect", pathname);
    
//     const redirectResponse = NextResponse.redirect(loginUrl);
//     redirectResponse.cookies.delete("auth_token");
    
//     return redirectResponse;

//   } catch (error) {
//     // Network error or verification failure = FAIL SECURE
//     // Block access and redirect to login
//     console.error("[Middleware] Auth verification failed (fail secure):", error);
    
//     const loginUrl = new URL("/", request.url);
//     loginUrl.searchParams.set("redirect", pathname);
    
//     const redirectResponse = NextResponse.redirect(loginUrl);
//     redirectResponse.cookies.delete("auth_token");
    
//     return redirectResponse;
//   }
// }

// // Configure which routes this middleware runs on
// export const config = {
//   matcher: [
//     /*
//      * 🔐 SECURITY: This matcher matches ALL page routes in the admin panel
//      * 
//      * PROTECTED ROUTES (require backend verification):
//      * - /dashboard/* (all dashboard pages and sub-routes)
//      * - /dashboard/Profile
//      * - /dashboard/CourseLeads
//      * - /dashboard/CourseManagement/*
//      * - /dashboard/BlogManagement/*
//      * - /dashboard/Settings/*
//      * - /about (if it exists)
//      * - ANY other route in the admin panel
//      * 
//      * EXCLUDED (not matched by middleware):
//      * - /api/* (API routes handle their own auth)
//      * - /_next/* (Next.js internal routes)
//      * - Static files (images, fonts, etc.)
//      * - favicon.ico
//      * 
//      * PUBLIC ROUTES (handled separately in middleware logic):
//      * - / (login page)
//      * - /forgot-password
//      * 
//      * EVERY route matched by this pattern will be verified with backend
//      * before allowing access. No exceptions.
//      */
//     /*
//      * Match all routes - exclusions are handled via early returns in middleware
//      * Next.js middleware matcher uses simple path patterns
//      * We match everything and filter _next/api/static files in the middleware function
//      */
//     "/:path*",
//   ],
// };




import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes (no auth needed)
  const publicRoutes = ["/", "/forgot-password"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Protect dashboard & all admin routes
  if (pathname.startsWith("/dashboard")) {
    const sessionCookie =
      request.cookies.get("laravel_session") ||
      request.cookies.get("skillvedika_session");

    // Not logged in → redirect to login
    if (!sessionCookie) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
