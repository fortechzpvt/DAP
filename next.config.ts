import type { NextConfig } from "next";

// Vercel serves the site from the domain root (custom domain or the
// assigned *.vercel.app URL), so no basePath/assetPrefix is needed. Static
// export is kept because the site has no server-only routes: all data
// (Supabase travel tips) is fetched client-side, see
// docs/architecture/travel-tips-backend.md. Vercel serves a static-export
// Next.js app's `out/` directory automatically, no extra config needed.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  // Stops `next dev`/`next build` from writing AGENTS.md/CLAUDE.md at the
  // repo root. Those are Next's own coding-assistant instructions, not
  // part of the site.
  agentRules: false,
};

export default nextConfig;
