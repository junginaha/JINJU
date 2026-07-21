import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JinjuApp from "@/components/JinjuApp";
import { getPublicPost, getPublicPosts, toClientPost } from "@/lib/public-posts";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPost(id);
  if (!post) return { title: "찾을 수 없는 의견 | 진주.kr", robots: { index: false, follow: false } };
  const path = `/post/${encodeURIComponent(post.id)}`;
  const description = "인간적으로, 할 말은 하세요! 안전하고 개운하게 속마음을 털어놓으세요";
  return {
    title: `${post.title} | 진주.kr`,
    description,
    alternates: { canonical: path },
    openGraph: { title: post.title, description, type: "article", url: path, siteName: "진주.kr", images: ["/jinju-pearl-cutout.png"] },
    twitter: { card: "summary_large_image", title: post.title, description, images: ["/jinju-pearl-cutout.png"] },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const selected = await getPublicPost(id);
  if (!selected) notFound();
  const byId = new Map((await getPublicPosts()).map((post) => [post.id, post]));
  byId.set(selected.id, selected);
  const initialPosts = [...byId.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map(toClientPost);
  return <JinjuApp initialPosts={initialPosts} initialPostId={selected.id} />;
}
