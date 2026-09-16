// lib/basePath.ts

// Mirrors the basePath logic in next.config.ts, keep them in sync. Once the
// custom domain cutover is live (NEXT_PUBLIC_CUSTOM_DOMAIN_LIVE=true at build time,
// see next.config.ts comment), the site serves from the domain root and needs no prefix.
const usesCustomDomain = process.env.NEXT_PUBLIC_CUSTOM_DOMAIN_LIVE === "true";
const basePath =
  process.env.NODE_ENV === "production" && !usesCustomDomain
    ? "/dinesh-a-pathum"
    : "";

// next/link auto-prefixes basePath, but next/image does not (per node_modules/next/dist/docs/.../basePath.md),
// and raw <video>/<source> tags don't either. Any hardcoded "/assets/..." path used as an
// <Image src>, a metadata URL, or a raw asset URL needs this helper.
export function withBasePath(path: string): string {
  if (path.startsWith("http")) {
    return path;
  }
  return `${basePath}${path}`;
}
