import type { Metadata } from "next";
import PolicyPage from "../../components/PolicyPage";
import ReportStatus from "../../components/ReportStatus";

export const metadata: Metadata = {
  title: "문제제보 처리상태",
  description: "진주.kr 문제제보·권리침해 신고의 처리 상태를 접수번호와 확인키로 확인합니다.",
  robots: { index: false, follow: false },
};

export default function ReportStatusPage() {
  return <PolicyPage eyebrow="JINJU · REPORT" title="문제제보 처리상태">
    <section>
      <h2>접수번호와 확인키로 확인하세요.</h2>
      <p>접수할 때 받은 두 항목은 다시 발급되지 않습니다. 별도의 연락처를 요구하지 않고 처리 상태를 확인할 수 있습니다.</p>
      <ReportStatus />
    </section>
    <section>
      <h2>개별 통지를 원한다면</h2>
      <p>전자우편으로 별도 통지를 받기 원하는 권리침해 신청인은 hello@xn--o55b9n.kr로 접수번호와 통지를 받을 전자우편 주소를 보내 지정할 수 있습니다. 이 주소는 해당 권리침해 처리와 통지 목적으로만 사용합니다.</p>
    </section>
  </PolicyPage>;
}
