import type { MetadataRoute } from "next";
import { PUBLIC_CATEGORIES } from "@/lib/categories";
import { getPublicPosts } from "@/lib/public-posts";
import { canonicalUrl, isSearchIndexable } from "@/lib/search-indexing";

export const dynamic = "force-dynamic";

const officialPages = [
  { path: "/about", priority: 0.8 },
  { path: "/terms", priority: 0.7 },
  { path: "/principles", priority: 0.7 },
  { path: "/safety", priority: 0.7 },
  { path: "/privacy", priority: 0.7 },
  { path: "/operation", priority: 0.5 },
];

const PAGE_SIZE = 30;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublicPosts();
  const newestPostTime = posts.reduce((latest, post) => {
    const timestamp = Date.parse(post.updatedAt || post.createdAt);
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
  }, 0);
  const archivePages = Array.from(
    { length: Math.max(0, Math.ceil(posts.length / PAGE_SIZE) - 1) },
    (_, index) => index + 2,
  );
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
    ...archivePages.map((page) => ({
      url: canonicalUrl(`/page/${page}`),
      ...(newestPostTime ? { lastModified: new Date(newestPostTime) } : {}),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...PUBLIC_CATEGORIES.map((category) => ({
      url: canonicalUrl(`/category/${encodeURIComponent(category)}`),
      ...(newestPostTime ? { lastModified: new Date(newestPostTime) } : {}),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...posts.filter((post) => isSearchIndexable(post.createdAt)).map((post) => ({
      url: canonicalUrl(`/post/${encodeURIComponent(post.id)}`),
      lastModified: new Date(post.updatedAt || post.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
