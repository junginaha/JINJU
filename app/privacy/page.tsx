import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";
import { SITE_NAME } from "@/lib/search-indexing";

const description = "진주.kr이 개인 식별정보를 요구하지 않고 익명 참여 토큰과 단방향 해시를 최소한으로 처리하는 방식을 안내합니다.";

export const metadata: Metadata = {
  title: "개인정보",
  description,
  alternates: { canonical: "/privacy", languages: { "ko-KR": "/privacy" } },
  openGraph: { title: `개인정보 | ${SITE_NAME}`, description, type: "website", url: "/privacy", siteName: SITE_NAME, locale: "ko_KR" },
};

export default function PrivacyPage() {
  return <PolicyPage eyebrow="JINJU · PRIVACY" title="개인정보"><section><h2>개인정보 0%를 지향합니다.</h2><p>이름·연락처 등 개인 식별정보를 요구하지 않습니다.</p></section><section><h2>익명 참여 무결성 검증</h2><p>좋아요·싫어요의 중복 참여를 방지하기 위해 브라우저에 HttpOnly·SameSite=Lax 속성의 무작위 익명 참여 토큰을 저장합니다. 서버에는 토큰 원문이 아닌 SHA-256 단방향 해시값만 기록하며, 게시글별 반응의 중복 여부를 검증하는 용도로만 처리합니다.</p></section><section><h2>기술 식별정보 보관 기간</h2><p>익명 참여 토큰과 단방향 해시 처리 기록 등 보안·서비스 악용 방지를 위한 최소한의 기술 식별정보는 최대 30일간 보관한 뒤 자동으로 삭제합니다.</p></section></PolicyPage>;
}
