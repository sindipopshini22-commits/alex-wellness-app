import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production: serve the Vite frontend SPA from public/frontend/
  // Build the frontend with: npm run build:frontend
  async rewrites() {
    return {
      // Serve the frontend SPA for pre-auth routes.
      // beforeFiles is required: plain-array rewrites are checked AFTER the
      // filesystem, so src/app/page.tsx and src/app/login/page.tsx would win
      // and the SPA would never be served on / or /login.
      beforeFiles: [
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
        // The dashboard is part of the SPA (client-side session check).
        // NOTE: beforeFiles rewrites override page files, so the Next.js
        // dashboard page (src/app/dashboard/page.tsx) is intentionally
        // shadowed by the SPA dashboard here.
        {
          source: "/dashboard",
          destination: "/frontend/index.html",
        },
      ],
      // Built SPA assets are emitted with a root-absolute base ("/assets/...");
      // map them to the actual location under /frontend/assets/...
      // (checked after pages/public files, since assets never collide)
      afterFiles: [
        {
          source: "/assets/:path*",
          destination: "/frontend/assets/:path*",
        },
        {
          source: "/favicon.svg",
          destination: "/frontend/favicon.svg",
        },
      ],
    };
  },
};

export default nextConfig;
