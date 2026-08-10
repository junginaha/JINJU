import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import PostArchive from "@/components/PostArchive";
import { getPublicPosts } from "@/lib/public-posts";
import { SITE_NAME } from "@/lib/search-indexing";

const PAGE_SIZE = 30;
type PageProps = { params: Promise<{ number: string }> };

export const revalidate = 30;

function parsePageNumber(value: string) {
  return /^\d+$/.test(value) ? Number(value) : NaN;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = parsePageNumber((await params).number);
  if (!Number.isInteger(page) || page < 2) return { robots: { index: false, follow: true } };
  const path = `/page/${page}`;
  const title = `공개 의견 ${page}쪽`;
  const description = `${SITE_NAME}의 공개 익명 의견 목록 ${page}쪽입니다.`;
  return {
    title,
    description,
    alternates: { canonical: path, languages: { "ko-KR": path } },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, type: "website", url: path, siteName: SITE_NAME, locale: "ko_KR" },
  };
}

export default async function PaginatedPostsPage({ params }: PageProps) {
  const page = parsePageNumber((await params).number);
  if (page === 1) permanentRedirect("/");
  if (!Number.isInteger(page) || page < 2) notFound();

  const publicPosts = await getPublicPosts();
  const totalPages = Math.ceil(publicPosts.length / PAGE_SIZE);
  if (page > totalPages) notFound();
  const start = (page - 1) * PAGE_SIZE;
  const posts = publicPosts.slice(start, start + PAGE_SIZE);

  return <PostArchive posts={posts} title="공개 의견 모아보기" eyebrow="JINJU.KR · ARCHIVE" page={page} totalPages={totalPages} totalPosts={publicPosts.length} />;
}
