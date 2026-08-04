import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";
import { SITE_NAME } from "@/lib/search-indexing";

const description = "진주.kr이 익명 의견을 보호하면서 개인정보 노출, 괴롭힘, 명예훼손, 불법·위험한 내용을 제한하는 운영원칙입니다.";

export const metadata: Metadata = {
  title: "운영원칙",
  description,
  alternates: { canonical: "/principles", languages: { "ko-KR": "/principles" } },
  openGraph: { title: `운영원칙 | ${SITE_NAME}`, description, type: "website", url: "/principles", siteName: SITE_NAME, locale: "ko_KR" },
};

export default function PrinciplesPage() {
  return <PolicyPage eyebrow="JINJU · PRINCIPLES" title="운영원칙"><section><h2>할 말은 하되, 사람을 해치지 않습니다.</h2><p>경험과 의견은 자유롭게 나눌 수 있습니다. 다만 개인정보 노출, 괴롭힘, 명예훼손, 불법·위험한 내용은 제한합니다.</p></section><section><h2>문제제보 수만으로 영구 삭제하지 않습니다.</h2><p>문제제보 횟수와 중복 여부를 함께 확인합니다. 필요한 경우 글을 임시로 가린 뒤 운영자가 최종 판단합니다.</p></section></PolicyPage>;
}
