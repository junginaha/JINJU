import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JinjuApp from "@/components/JinjuAppBridge";
import { getPublicComments } from "@/lib/public-comments";
import { getPublicPost, getPublicPosts, toClientPost } from "@/lib/public-posts";
import {
  canonicalUrl,
  isSearchIndexable,
  SITE_NAME,
  SITE_ORGANIZATION_ID,
  SITE_WEBSITE_ID,
} from "@/lib/search-indexing";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPost(id);
  if (!post) return { title: "찾을 수 없는 의견", robots: { index: false, follow: false } };
  const path = `/post/${encodeURIComponent(post.id)}`;
  const description = post.content.replace(/\s+/g, " ").trim().slice(0, 150);
  const searchIndexable = isSearchIndexable(post.createdAt);
  const image = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: "진주.kr — 전국 누구나 쓰는 독립 익명 의견 커뮤니티",
  };
  return {
    title: post.title,
    description,
    keywords: [post.category, "익명 의견", "진주.kr"],
    robots: { index: searchIndexable, follow: true },
    alternates: {
      canonical: path,
      languages: { "ko-KR": path },
    },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      url: path,
      siteName: SITE_NAME,
      locale: "ko_KR",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const selected = await getPublicPost(id);
  if (!selected) notFound();
  const [publicPosts, commentsResult] = await Promise.all([
    getPublicPosts(),
    getPublicComments(id),
  ]);
  const selectedIndex = publicPosts.findIndex((post) => post.id === selected.id);
  const adjacentPosts = [publicPosts[selectedIndex - 1], publicPosts[selectedIndex + 1]].filter(Boolean);
  const relatedCandidates = [
    ...adjacentPosts,
    ...publicPosts.filter((post) => post.id !== selected.id && post.category === selected.category),
    ...publicPosts.filter((post) => post.id !== selected.id),
  ];
  const relatedPosts = [...new Map(relatedCandidates.map((post) => [post.id, post])).values()].slice(0, 29);
  const initialComments = commentsResult.ok ? commentsResult.comments.slice(0, 10) : [];
  const initialPosts = [
    toClientPost(selected, initialComments),
    ...relatedPosts.map((post) => toClientPost(post)),
  ];
  const postUrl = canonicalUrl(`/post/${encodeURIComponent(selected.id)}`);
  const discussionPost = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": `${postUrl}#posting`,
    url: postUrl,
    headline: selected.title,
    text: selected.content,
    articleBody: selected.content,
    articleSection: selected.category,
    datePublished: selected.createdAt,
    dateModified: selected.updatedAt || selected.createdAt,
    inLanguage: "ko-KR",
    author: {
      "@type": "Person",
      name: selected.displayName?.trim() || "익명",
    },
    publisher: { "@id": SITE_ORGANIZATION_ID },
    isPartOf: { "@id": SITE_WEBSITE_ID },
    mainEntityOfPage: postUrl,
    commentCount: selected.commentCount,
    ...(initialComments.length ? {
      comment: initialComments.map((comment) => ({
        "@type": "Comment",
        text: comment.body,
        dateCreated: comment.createdAt,
        author: {
          "@type": "Person",
          name: comment.displayName || "익명",
        },
      })),
    } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(discussionPost).replace(/</g, "\\u003c") }}
      />
      <JinjuApp initialPosts={initialPosts} initialPostId={selected.id} />
    </>
  );
}
