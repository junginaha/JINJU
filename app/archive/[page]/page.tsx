import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import PostArchive from "@/components/PostArchive";
import { archivePath } from "@/lib/post-archive";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ page: string }> };
function parsePage(value: string) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) notFound();
  return Number(value);
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = parsePage((await params).page);
  return { title: `전체 글 · ${page}페이지`, description: `진주.kr 공개 의견 목록 ${page}페이지. 일상과 관계, 마음과 책에 관한 이야기를 읽어 보세요.`, alternates: { canonical: archivePath(page) } };
}
export default async function Page({ params }: Props) {
  const page = parsePage((await params).page);
  if (page === 1) permanentRedirect("/archive");
  return <PostArchive page={page} />;
}
