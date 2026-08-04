import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";
import { SITE_NAME } from "@/lib/search-indexing";

const description = "진주.kr 공개베타 운영 상태와 우선 점검 항목, 익명 문제제보 방법을 안내합니다.";

export const metadata: Metadata = {
  title: "공개베타 안내",
  description,
  alternates: { canonical: "/beta", languages: { "ko-KR": "/beta" } },
  openGraph: { title: `공개베타 안내 | ${SITE_NAME}`, description, type: "website", url: "/beta", siteName: SITE_NAME, locale: "ko_KR" },
};

export default function BetaPage() {
  return <PolicyPage eyebrow="JINJU · BETA" title="공개베타 안내"><section><h2>지금은 공개베타 기간입니다.</h2><p>정식 공개 전 실제 사용 환경을 점검하고 있습니다. 글쓰기·검색·의견 보내기 흐름을 우선 안정화하고 있습니다.</p></section><section><h2>불편한 점을 알려 주세요.</h2><p>각 글의 ‘의견 보내기’를 이용하면 이름이나 연락처 없이 접수할 수 있습니다.</p></section></PolicyPage>;
}
