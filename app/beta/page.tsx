import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";
import { SITE_NAME } from "@/lib/search-indexing";

const description = "진주.kr의 정식 운영 상태와 안정화 원칙, 익명 문제제보 방법을 안내합니다.";

export const metadata: Metadata = {
  title: "정식 운영 안내",
  description,
  alternates: { canonical: "/beta", languages: { "ko-KR": "/beta" } },
  openGraph: { title: `정식 운영 안내 | ${SITE_NAME}`, description, type: "website", url: "/beta", siteName: SITE_NAME, locale: "ko_KR" },
};

export default function BetaPage() {
  return <PolicyPage eyebrow="JINJU · OPERATING" title="정식 운영 안내"><section><h2>진주.kr은 정식 운영 중입니다.</h2><p>실제 사용 환경을 지속적으로 점검하며 글쓰기·검색·문제제보 흐름을 안정적으로 운영하고 있습니다.</p></section><section><h2>불편한 점을 알려 주세요.</h2><p>각 글의 ‘의견 보내기’를 이용하면 이름이나 연락처 없이 접수할 수 있습니다.</p></section></PolicyPage>;
}
