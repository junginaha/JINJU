import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    sitemap: "https://xn--o55b9n.kr/sitemap.xml",
    host: "https://xn--o55b9n.kr",
  };
}
