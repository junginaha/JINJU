import type { Metadata } from "next";
import PostArchive from "@/components/PostArchive";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "전체 글 · 1페이지",
  description: "진주.kr의 일상, 관계, 마음, 책에 관한 공개 의견을 최신순으로 읽어 보세요.",
  alternates: { canonical: "/archive" },
};
export default function Page() { return <PostArchive page={1} />; }
