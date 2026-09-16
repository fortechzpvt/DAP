import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { withBasePath } from "@/lib/basePath";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/journeys", "/videos", "/contact"];
  return routes.map((route) => ({
    url: `${SITE_URL}${withBasePath(route)}`,
    lastModified: new Date(),
  }));
}
