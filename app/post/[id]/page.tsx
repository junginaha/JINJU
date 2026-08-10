import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JinjuApp from "@/components/JinjuAppBridge";
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
    alt: "진주.kr — 인간적으로, 할 말은 하세요",
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
  const recentPosts = (await getPublicPosts()).filter((post) => post.id !== selected.id).slice(0, 29);
  const initialPosts = [selected, ...recentPosts].map(toClientPost);
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
