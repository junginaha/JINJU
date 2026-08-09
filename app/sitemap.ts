import type { MetadataRoute } from "next";
import { getPublicPosts } from "@/lib/public-posts";
import { canonicalUrl } from "@/lib/search-indexing";

export const dynamic = "force-dynamic";

const officialPages = [
  { path: "/about", priority: 0.8 },
  { path: "/terms", priority: 0.7 },
  { path: "/principles", priority: 0.7 },
  { path: "/safety", priority: 0.7 },
  { path: "/privacy", priority: 0.7 },
  { path: "/beta", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublicPosts();
  const newestPostTime = posts.reduce((latest, post) => {
    const timestamp = Date.parse(post.updatedAt || post.createdAt);
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
  }, 0);
  return [
    {
      url: canonicalUrl("/"),
      ...(newestPostTime ? { lastModified: new Date(newestPostTime) } : {}),
      changeFrequency: "daily",
      priority: 1,
    },
    ...officialPages.map(({ path, priority }) => ({
      url: canonicalUrl(path),
      changeFrequency: "monthly" as const,
      priority,
    })),
    ...posts.map((post) => ({
      url: canonicalUrl(`/post/${encodeURIComponent(post.id)}`),
      lastModified: new Date(post.updatedAt || post.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
