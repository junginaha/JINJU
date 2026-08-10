import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostArchive from "@/components/PostArchive";
import { PUBLIC_CATEGORIES, type PublicCategory } from "@/lib/categories";
import { getPublicPosts } from "@/lib/public-posts";
import { SITE_NAME } from "@/lib/search-indexing";

type PageProps = { params: Promise<{ category: string }> };

export const revalidate = 30;

function publicCategory(value: string): PublicCategory | null {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  return PUBLIC_CATEGORIES.includes(decoded as PublicCategory) ? decoded as PublicCategory : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = publicCategory((await params).category);
  if (!category) return { robots: { index: false, follow: true } };
  const path = `/category/${encodeURIComponent(category)}`;
  const title = `${category} 익명 의견`;
  const description = `${SITE_NAME}의 ${category} 카테고리 공개 익명 의견입니다.`;
  return {
    title,
    description,
    alternates: { canonical: path, languages: { "ko-KR": path } },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, type: "website", url: path, siteName: SITE_NAME, locale: "ko_KR" },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const category = publicCategory((await params).category);
  if (!category) notFound();
  const publicPosts = await getPublicPosts();
  const posts = publicPosts.filter((post) => post.category === category);

  return <PostArchive posts={posts} title={`${category} 의견`} eyebrow="JINJU.KR · CATEGORY" totalPosts={posts.length} currentCategory={category} />;
}
