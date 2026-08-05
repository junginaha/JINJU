import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";
import { SITE_NAME } from "@/lib/search-indexing";

const description = "진주.kr이 개인 식별정보를 요구하지 않고 익명 참여와 서비스 보호에 필요한 기술정보를 최소한으로 처리하는 방식을 안내합니다.";

export const metadata: Metadata = {
  title: "개인정보",
  description,
  alternates: { canonical: "/privacy", languages: { "ko-KR": "/privacy" } },
  openGraph: { title: `개인정보 | ${SITE_NAME}`, description, type: "website", url: "/privacy", siteName: SITE_NAME, locale: "ko_KR" },
};

export default function PrivacyPage() {
  return <PolicyPage eyebrow="JINJU · PRIVACY" title="개인정보">
    <section>
      <h2>개인 식별정보를 요구하지 않습니다.</h2>
      <p>회원가입 없이 이용할 수 있으며 이름·전화번호·이메일 주소를 필수로 받지 않습니다. 게시글과 댓글에도 본인이나 타인을 알아볼 수 있는 정보를 적지 말아주세요.</p>
    </section>
    <section>
      <h2>처리하는 정보와 목적</h2>
      <p>사용자가 직접 입력한 게시글·댓글·문제제보 내용은 공개와 운영 검토를 위해 처리합니다. 중복 반응과 반복 요청을 막기 위해 무작위 익명 참여 토큰, 요청 네트워크 정보와 브라우저 정보에서 생성한 단방향 해시, 요청 횟수와 만료 시각을 처리할 수 있습니다. 원래의 네트워크 주소와 브라우저 문자열은 데이터베이스에 그대로 저장하지 않습니다.</p>
    </section>
    <section>
      <h2>익명 참여 무결성 검증</h2>
      <p>좋아요·싫어요의 중복 참여를 방지하기 위해 브라우저에 HttpOnly·SameSite=Lax 속성의 무작위 익명 참여 토큰을 저장합니다. 서버에는 토큰 원문이 아닌 SHA-256 단방향 해시값만 기록하며, 게시글별 반응의 중복 여부를 확인하는 용도로만 사용합니다.</p>
    </section>
    <section>
      <h2>게시 전 보호 확인과 외부 처리</h2>
      <p>개인정보·위험 표현을 확인하고 음성을 글자로 바꾸기 위해, 해당 기능을 사용할 때 작성 내용이나 음성 파일이 외부 처리 서비스로 전송될 수 있습니다. 서비스 운영에는 Vercel의 호스팅, Neon의 데이터베이스, 설정된 경우 OpenAI의 안전 검수·음성 변환 기능을 사용합니다. 이 정보는 광고 목적으로 판매하지 않습니다.</p>
    </section>
    <section>
      <h2>보관 기간과 파기</h2>
      <p>익명 참여 토큰과 반응 중복 방지 기록은 최대 30일간 보관한 뒤 만료 또는 삭제합니다. 요청 속도 제한 기록은 각 제한 구간이 끝날 때까지 보관합니다. 게시글·댓글·문제제보는 서비스 제공과 분쟁 대응에 필요한 기간 동안 보관하며, 삭제 또는 권리침해 요청이 확인되면 운영 기준에 따라 숨김·삭제합니다. 전자 기록은 데이터베이스에서 삭제하고 브라우저 토큰은 만료 처리합니다.</p>
    </section>
    <section>
      <h2>안전조치</h2>
      <p>전송 구간 암호화, 접근 권한 제한, 단방향 해시, 요청 횟수 제한, 게시 전 개인정보 검사와 신고 기능을 사용합니다. 개인정보나 권리침해 내용이 발견되면 공개하지 않거나 신속히 조치합니다.</p>
    </section>
    <section>
      <h2>문의와 권리 행사</h2>
      <p>본인이 작성한 내용의 삭제, 권리침해 신고, 개인정보 처리 문의는 문제제보 기능 또는 hello@xn--o55b9n.kr로 보내주세요. 확인에 필요한 최소한의 정보만 요청하며 처리 결과를 안내합니다.</p>
    </section>
  </PolicyPage>;
}
