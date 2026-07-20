import type { MetadataRoute } from "next";
import { getPublicPosts } from "@/lib/public-posts";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublicPosts();
  return [
    { url: "https://xn--o55b9n.kr/", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...posts.map((post) => ({
      url: `https://xn--o55b9n.kr/post/${encodeURIComponent(post.id)}`,
      lastModified: new Date(post.updatedAt || post.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
