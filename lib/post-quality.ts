export const POST_MIN_CONTENT_LENGTH = 30;

export type PostQualityReview = {
  passed: boolean;
  detectedIssues: string[];
  explanation: string;
  suggestion: string;
};

function compact(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function repeatedFragment(value: string) {
  return /(.)\1{4,}/u.test(value) || /(.{2,10})\1{2,}/u.test(value);
}

export function assessPostQuality(title: string, content: string): PostQualityReview {
  const normalizedTitle = title.normalize("NFKC").trim();
  const normalizedContent = content.normalize("NFKC").replace(/\s+/g, " ").trim();
  const titleKey = compact(normalizedTitle);
  const contentKey = compact(normalizedContent);
  const hangulCount = (normalizedContent.match(/[가-힣]/g) || []).length;
  const digitsCount = (normalizedContent.match(/\d/g) || []).length;
  const visibleCount = contentKey.length;
  const issues: string[] = [];

  if (normalizedContent.length < POST_MIN_CONTENT_LENGTH) issues.push("상황 설명이 너무 짧음");
  if (hangulCount < 12) issues.push("의미를 파악하기 어려운 내용");
  if (visibleCount > 0 && digitsCount / visibleCount >= 0.35) issues.push("숫자·기호 중심의 문자열");
  if (normalizedTitle && titleKey === contentKey) issues.push("제목과 본문이 같은 내용");
  if (repeatedFragment(contentKey)) issues.push("같은 글자나 문구의 반복");

  const detectedIssues = [...new Set(issues)];
  if (detectedIssues.length === 0) {
    return {
      passed: true,
      detectedIssues: [],
      explanation: "상황과 생각을 이해할 수 있는 글입니다.",
      suggestion: "바로 게시할 수 있습니다.",
    };
  }

  return {
    passed: false,
    detectedIssues,
    explanation: "다른 사람이 상황과 생각을 이해하기 어려운 부분이 있어요.",
    suggestion: "무슨 일이 있었는지와 그때 느낀 점을 서로 다른 한두 문장으로 조금 더 적어주세요.",
  };
}
