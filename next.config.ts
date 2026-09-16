import type { NextConfig } from "next";

// Once a custom domain is pointed at GitHub Pages and verified, the site is
// served from the domain root and must build with NO basePath. A subpath
// prefix would 404 every asset and internal link. Until that DNS/Pages cutover
// is finished, the site keeps deploying to the bare project-page URL
// (<user>.github.io/dinesh-a-pathum), which still needs the prefix. Flip the
// cutover by setting NEXT_PUBLIC_CUSTOM_DOMAIN_LIVE=true in the production
// build environment. No further code change needed.
// `next dev` sets NODE_ENV to "development", so basePath stays empty locally either way.
const usesCustomDomain = process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_LIVE === "true";
const basePath =
  process.env.NODE_ENV === "production" && !usesCustomDomain
    ? "/dinesh-a-pathum"
    : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  // Stops `next dev`/`next build` from writing AGENTS.md/CLAUDE.md at the
  // repo root. Those are Next's own coding-assistant instructions, not
  // part of the site.
  agentRules: false,
};

export default nextConfig;
