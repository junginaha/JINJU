import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";
import { SITE_NAME } from "@/lib/search-indexing";

const description = "진주.kr이 익명 의견을 보호하면서 개인정보 노출, 괴롭힘, 명예훼손, 불법·위험한 내용을 제한하고 권리침해 요청을 처리하는 운영원칙입니다.";

export const metadata: Metadata = {
  title: "운영원칙",
  description,
  alternates: { canonical: "/principles", languages: { "ko-KR": "/principles" } },
  openGraph: { title: `운영원칙 | ${SITE_NAME}`, description, type: "website", url: "/principles", siteName: SITE_NAME, locale: "ko_KR" },
};

export default function PrinciplesPage() {
  return <PolicyPage eyebrow="JINJU · PRINCIPLES" title="운영원칙">
    <section>
      <h2>할 말은 하되, 사람을 해치지 않습니다.</h2>
      <p>경험과 의견은 자유롭게 나눌 수 있습니다. 다만 개인정보 노출, 괴롭힘, 명예훼손, 사생활 침해, 불법·위험한 내용과 반복 광고·도배는 제한합니다.</p>
    </section>
    <section>
      <h2>AI는 위험을 알려주는 보조 장치입니다.</h2>
      <p>게시 전 자동 검수는 개인정보나 위험 표현처럼 놓치기 쉬운 지점을 알려주는 보조 수단입니다. AI의 판단 자체가 사실 여부나 법적 책임을 확정하지 않으며, 이용자는 안내를 확인한 뒤 자신의 표현과 게시 선택에 책임을 집니다. 서비스는 법적 의무와 운영원칙에 따라 공개 범위를 별도로 제한할 수 있습니다.</p>
    </section>
    <section>
      <h2>문제제보 수만으로 영구 삭제하지 않습니다.</h2>
      <p>문제제보 횟수와 중복 여부를 함께 확인합니다. 짧은 시간에 서로 다른 익명 신고가 집중되면 우선 임시로 가릴 수 있지만, 영구 삭제 여부는 신고 숫자만으로 결정하지 않고 운영자가 내용과 권리침해 가능성을 확인합니다.</p>
    </section>
    <section>
      <h2>권리침해가 의심되면 먼저 피해를 줄입니다.</h2>
      <p>사생활 침해·명예훼손 등 권리침해 여부를 바로 판단하기 어렵거나 분쟁이 예상되는 경우 최대 30일 범위에서 접근을 임시 제한할 수 있습니다. 게시자는 게시글 ID와 재게시 사유를 문제제보 경로로 제출해 이의를 제기할 수 있으며, 익명 구조상 작성자 확인이 어려운 경우에는 권리 보호를 우선할 수 있습니다.</p>
    </section>
    <section>
      <h2>익명 통계는 사람을 찾기보다 흐름을 봅니다.</h2>
      <p>좋아요·싫어요와 OK↔NOT OK 슬라이더 등 반응은 개인을 특정하는 프로필을 만드는 데 사용하지 않습니다. 개인과 분리된 집계 통계는 서비스 개선, 연구, 여론·감정 흐름 분석과 리포트에 활용할 수 있습니다.</p>
    </section>
  </PolicyPage>;
}
