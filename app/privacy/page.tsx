import PolicyPage from "../../components/PolicyPage";

export default function PrivacyPage() {
  return <PolicyPage eyebrow="JINJU · PRIVACY" title="개인정보 안내"><section><h2>개인정보 0%를 지향합니다.</h2><p>이름·연락처 등 개인 식별정보를 요구하지 않습니다.</p></section><section><h2>익명 반응 증명</h2><p>좋아요·싫어요의 중복을 막을 때 신원을 밝히지 않고 참여 자격만 확인하는 영지식 증명을 사용합니다. 비밀 신원키는 이 기기에만 보관되며 서버에는 공개 증명값만 전달됩니다.</p></section><section><h2>기술 식별정보 보관 기간</h2><p>보안과 서비스 악용 방지를 위한 최소한의 기술 식별정보는 최대 30일간 보관한 뒤 자동 삭제합니다.</p></section></PolicyPage>;
}
