export type RiskLevel = "low" | "medium" | "high" | "urgent";

const pii = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{6}[-\s]?\d{7}\b|https?:\/\/\S+/i;
const urgent = ["죽고 싶", "자살", "목숨을 끊", "죽여버", "칼로", "불 질러"];
const high = ["사기꾼", "성범죄자", "살인자", "횡령", "협박", "스토킹", "불법촬영", "신상 털"];
const medium = ["씨발", "시발", "병신", "쓰레기", "무조건", "확실하다"];

export function reviewText(value: string) {
  const normalized = value.normalize("NFKC");
  const issues: string[] = [];
  let riskLevel: RiskLevel = "low";
  if (pii.test(normalized)) { issues.push("개인정보 또는 외부 링크"); riskLevel = "high"; }
  if (medium.some((word) => normalized.includes(word))) { issues.push("욕설·강한 단정 표현"); riskLevel = riskLevel === "high" ? "high" : "medium"; }
  if (high.some((word) => normalized.includes(word))) { issues.push("권리침해·비방 가능성"); riskLevel = "high"; }
  if (urgent.some((word) => normalized.includes(word))) { issues.push("즉각적인 위험 표현"); riskLevel = "urgent"; }
  return {
    riskLevel,
    detectedIssues: [...new Set(issues)],
    explanation: issues.length ? "위험 가능성이 있는 표현을 확인했습니다. 특정인을 알아볼 수 있는 정보와 단정 표현을 지워주세요." : "개인정보와 즉각적인 위험 표현이 발견되지 않았습니다.",
  };
}

export function hasPii(value: string) {
  return pii.test(value);
}
