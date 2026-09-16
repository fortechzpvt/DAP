import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { withBasePath } from "@/lib/basePath";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}${withBasePath("/sitemap.xml")}`,
  };
}
