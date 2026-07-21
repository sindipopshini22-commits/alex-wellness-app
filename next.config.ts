import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production: serve the Vite frontend SPA from public/frontend/
  // Build the frontend with: npm run build:frontend
  async rewrites() {
    return [
      // Serve the frontend SPA for pre-auth routes
      {
        source: "/",
        destination: "/frontend/index.html",
      },
      {
        source: "/login",
        destination: "/frontend/index.html",
      },
      {
        source: "/questionnaire",
        destination: "/frontend/index.html",
      },
      {
        source: "/frontend/assets/:path*",
        destination: "/frontend/assets/:path*",
      },
      {
        source: "/favicon.svg",
        destination: "/frontend/favicon.svg",
      },
    ];
  },
};

export default nextConfig;
