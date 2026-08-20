import { assertEditorialDiversity } from "./editorial-diversity";
import type { EditorialComment, EditorialPost } from "./editorial";

// 운영 내부 검증용입니다. 공개 게시글과 댓글에는 출처나 작업 표식을 노출하지 않습니다.
export const counterfeitReportingResearchSources = [
  "사용자 제공 중고거래 피해 화면 5장, 2026-08-20 (닉네임·지역·링크·비밀번호 비공개)",
  "https://ecrm.police.go.kr",
] as const;

export const counterfeitReportingPost: EditorialPost = {
  id: "jinju-topical-20260820-counterfeit-reporting",
  title: "가품을 신고했는데, 멈춘 건 제 계정이었습니다",
  content: "중고거래 앱에서 제가 찍은 고가 목걸이 사진을 베껴 가품으로 의심되는 물건을 파는 계정들을 발견해 원본 사진·게시 시각·대화를 모아 신고했는데, 그 직후 여러 신고가 몰리며 정작 제 계정이 먼저 정지됐습니다. 의심 계정은 이름을 바꿔 다시 나타나고 신고자는 소명 창구를 찾아 헤매는 동안, 플랫폼은 신고 숫자보다 원본과 거래 증거를 먼저 살펴야 합니다.",
  category: "사회",
  displayName: "거래 기록자",
  mode: "털어놓기",
  createdAt: "2026-08-20T12:36:00+09:00",
  updatedAt: "2026-08-20T12:36:00+09:00",
  heard: 33,
  same: 18,
  support: 0,
  commentCount: 12,
};

const COMMENT_SEEDS = [
  {
    stance: "agree",
    displayName: "피해 정리자",
    body: "실제 금전 피해가 있다면 플랫폼 신고만으로 끝내지 말고 경찰청 사이버범죄 신고시스템에 접수할 수 있습니다. 게시글·채팅·송금 내역·계좌정보를 날짜 순서대로 묶어두세요.",
  },
  {
    stance: "caution",
    displayName: "신중한 제보자",
    body: "가품이 확정되기 전에 상대 닉네임과 주소를 공개하며 단정하면 또 다른 분쟁이 생길 수 있어요. 공개 저격보다 플랫폼과 수사기관에 원본 자료를 제출하는 편이 안전합니다.",
  },
  {
    stance: "agree",
    displayName: "원본 보관자",
    body: "사진 원본, 최초 게시 시각, 도용된 화면의 주소와 캡처, 신고 접수 화면을 따로 저장하세요. 계정이 사라진 뒤에는 ‘그때 봤다’는 기억보다 남아 있는 파일이 훨씬 강합니다.",
  },
  {
    stance: "caution",
    displayName: "운영 현실파",
    body: "신고가 갑자기 몰리면 피해 확산을 막기 위해 임시 제한이 필요할 때도 있습니다. 문제는 제한 자체보다 빠른 사람 검토와 이의제기 통로가 함께 있느냐겠죠.",
  },
  {
    stance: "agree",
    displayName: "계정 재봉사",
    body: "사기꾼은 계정을 갈아입고 신고자는 소명서에 정장을 입는군요. 이 정도면 플랫폼의 옷장 검사가 거꾸로 된 것 같습니다.",
  },
  {
    stance: "caution",
    displayName: "분쟁 조정자",
    body: "신고 횟수만으로 즉시 유죄를 정하는 것도, 오래 활동한 계정이라고 무조건 믿는 것도 위험합니다. 원본 사진과 거래 흐름을 기준으로 판단하는 절차가 필요해요.",
  },
  {
    stance: "agree",
    displayName: "이미지 확인자",
    body: "비싼 물건은 거래 전에 사진 역검색을 해보고 판매자가 직접 찍은 추가 사진을 요청해보세요. 보증서 한 장만 보지 말고 구매 경위와 제품 세부 상태가 서로 맞는지도 확인해야 합니다.",
  },
  {
    stance: "caution",
    displayName: "직거래 경험자",
    body: "직거래도 만능은 아닙니다. 사람이 많은 장소에서 충분히 확인하고, 고액 거래라면 급하게 결제하지 말고 검증 방법부터 정한 뒤 만나세요.",
  },
  {
    stance: "agree",
    displayName: "동네 풍자가",
    body: "당근은 땅에서 금방 캐는데 진실은 고객센터 지하 8층쯤에 묻혀 있나 봅니다. 신고 버튼 옆에 ‘증거 검토 중’이라는 작은 창문이라도 달아주세요.",
  },
  {
    stance: "caution",
    displayName: "결제 상담자",
    body: "결제 수단마다 취소와 분쟁 절차가 다르니 피해를 알게 된 즉시 해당 결제 서비스와 은행·카드사에 문의하세요. 단순 착오송금과 사기 피해는 처리 경로가 같지 않을 수 있습니다.",
  },
  {
    stance: "agree",
    displayName: "소명 준비자",
    body: "계정 정지 이의제기에는 감정적인 호소보다 내가 원본 게시자라는 자료, 신고한 시간, 상대 글과의 비교표를 짧게 붙이는 게 좋습니다. 접수번호와 답변 시각도 계속 기록해두세요.",
  },
  {
    stance: "caution",
    displayName: "안전 거래자",
    body: "억울해서 직접 상대를 추적하거나 집 주소를 찾아가지는 마세요. 돈과 계정도 중요하지만, 신고한 사람이 더 위험해지지 않는 것이 먼저입니다.",
  },
] as const;

const COMMENT_MINUTE_OFFSETS = [4, 9, 15, 27, 46, 73, 118, 184, 276, 411, 648, 1023] as const;

function addMinutes(value: string, minutes: number) {
  return new Date(Date.parse(value) + minutes * 60_000).toISOString();
}

const COMMENTS: EditorialComment[] = COMMENT_SEEDS.map((comment, index) => ({
  id: `topical-0820-counterfeit-${index + 1}-${comment.stance}`,
  displayName: comment.displayName,
  body: comment.body,
  createdAt: addMinutes(counterfeitReportingPost.createdAt, COMMENT_MINUTE_OFFSETS[index]),
}));

export function counterfeitReportingComments(postId: string) {
  return postId === counterfeitReportingPost.id ? COMMENTS : [];
}

assertEditorialDiversity([counterfeitReportingPost], counterfeitReportingComments);
