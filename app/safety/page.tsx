import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";
import { SITE_NAME } from "@/lib/search-indexing";

const description = "진주.kr에서 개인정보 노출, 명예훼손·사생활 침해 등 권리침해를 익명으로 신고하고 임시조치를 요청하는 방법을 안내합니다.";

export const metadata: Metadata = {
  title: "안전안내",
  description,
  alternates: { canonical: "/safety", languages: { "ko-KR": "/safety" } },
  openGraph: { title: `안전안내 | ${SITE_NAME}`, description, type: "website", url: "/safety", siteName: SITE_NAME, locale: "ko_KR" },
};

export default function SafetyPage() {
  return <PolicyPage eyebrow="JINJU · SAFETY" title="안전안내">
    <section>
      <h2>개인 식별정보를 적지 마세요.</h2>
      <p>이름, 연락처, 상세 주소, 계정 정보처럼 누군가를 알아볼 수 있는 정보는 글과 댓글에서 지워 주세요.</p>
    </section>
    <section>
      <h2>‘의견 보내기’는 문제제보·권리침해 신고 창구입니다.</h2>
      <p>각 게시글의 ‘의견 보내기’에서 권리침해·삭제·임시조치 요청, 개인정보 노출, 실명 거론·명예훼손, 혐오·괴롭힘, 불법·위험한 내용, 광고·도배 등의 사유를 선택해 익명으로 접수할 수 있습니다.</p>
    </section>
    <section>
      <h2>접수 후 필요한 범위에서 먼저 조치합니다.</h2>
      <p>접수번호와 확인키를 발급하고, 개인정보 노출처럼 피해 확산 가능성이 큰 건을 우선 확인합니다. 권리침해 여부를 즉시 판단하기 어렵거나 당사자 간 다툼이 예상되는 경우 최대 30일 범위에서 게시물 접근을 임시로 제한할 수 있습니다. 자세한 기준과 이의 절차는 <a href="/terms">이용약관</a>과 <a href="/principles">운영원칙</a>에서 확인할 수 있습니다.</p>
      <p>이미 접수했다면 <a href="/report-status">문제제보 처리상태</a>에서 접수번호와 확인키로 진행 상태를 확인할 수 있습니다.</p>
    </section>
    <section>
      <h2>긴급한 위험은 긴급기관을 이용해 주세요.</h2>
      <p>진주의 문제제보는 긴급구조나 수사기관 신고를 대신하지 않습니다. 생명·신체에 즉각적인 위험이 있는 경우에는 해당 상황에 맞는 긴급기관에 바로 도움을 요청해 주세요.</p>
    </section>
    <section>
      <h2>청소년 보호</h2>
      <p>진주는 청소년유해매체물을 제공하기 위한 서비스가 아닙니다. 청소년 보호 관련 신고와 문의는 hello@xn--o55b9n.kr로 접수합니다. 법령상 청소년보호책임자 지정 요건에 해당하게 되는 경우 책임자 정보를 이 페이지에 공개합니다.</p>
    </section>
    <section>
      <h2>운영자·사업자 정보</h2>
      <p>운영 문의: hello@xn--o55b9n.kr. 현재 공개 게시판의 열람·작성 과정에서는 재화나 용역의 구매 청약을 받지 않습니다. 향후 유료 거래 기능을 제공하는 경우 관계 법령에 따라 상호·대표자·주소·연락처·사업자등록정보 및 필요한 통신판매 정보를 별도로 표시합니다.</p>
    </section>
  </PolicyPage>;
}
