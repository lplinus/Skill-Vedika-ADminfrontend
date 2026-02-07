// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   reactCompiler: true,
//   // Proxy /api/* requests to the backend Laravel server running locally.
//   // This avoids CORS and lets the frontend call `/api/...` as intended by the axios instance.
//   async rewrites() {
//     const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
//     // Remove /api suffix if present to avoid double /api/api
//     const baseUrl = backendUrl.replace(/\/api\/?$/, '');
    
//     return [
//       {
//         source: "/api/:path*",
//         destination: `${baseUrl}/api/:path*`,
//       },
//     ];
//   },
// };

// export default nextConfig;



import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // ✅ Allow external images from Cloudinary
  images: {
    domains: ["res.cloudinary.com"],
  },

  // Proxy /api/* requests to Laravel backend
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    // Remove /api suffix if present to avoid /api/api
    const baseUrl = backendUrl.replace(/\/api\/?$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${baseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
