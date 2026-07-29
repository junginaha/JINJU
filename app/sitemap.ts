import type { MetadataRoute } from "next";
import { getPublicPosts } from "@/lib/public-posts";
import { canonicalUrl } from "@/lib/search-indexing";

export const dynamic = "force-dynamic";

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
    ...posts.map((post) => ({
      url: canonicalUrl(`/post/${encodeURIComponent(post.id)}`),
      lastModified: new Date(post.updatedAt || post.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
