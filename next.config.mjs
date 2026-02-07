// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   images: {
//     unoptimized: true,
//   },

//   // Note: API route handlers in /app/api/* take precedence over rewrites
//   // So /api/leads/* requests will be handled by route.js files, not rewrites
//   // This ensures proper Authorization header forwarding
//   async rewrites() {
//     const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
//     // Remove /api suffix if present to avoid double /api/api
//     const baseUrl = backendUrl.replace(/\/api\/?$/, '');
    
//     return [
//       {
//         source: '/api/:path*',
//         destination: `${baseUrl}/api/:path*`,
//       },
//     ];
//   },

// }

// export default nextConfig
