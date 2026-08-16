import type { EditorialComment } from "./editorial";

type HumorComment = {
  displayName: string;
  body: string;
};

const COMMENTS: Record<string, HumorComment> = {
  "jinju-daily-20260816-bookclub-stopped-page-83": {
    displayName: "책갈피 탈주",
    body: "83쪽에서 책은 덮었지만 발제는 활짝 열렸네요. 완독자들이 결말을 말할 때만 ‘저는 여기부터 유료회원 아닙니다’ 표정 관리가 필요하겠습니다.",
  },
  "jinju-daily-20260816-family-last-treatment-talk": {
    displayName: "차한잔 회의",
    body: "명절 밥상에서 꺼내면 전 부치던 손까지 멈출 주제라, 평범한 날 차 한 잔 앞에 두고 시작해야겠어요. 가족회의 안건명은 ‘오래 잘 살기 위한 마지막 선택’ 정도가 덜 무섭겠습니다.",
  },
  "jinju-daily-20260816-care-premium-choice": {
    displayName: "통장 효자",
    body: "보험료는 자동이체가 제일 먼저 효도를 하고, 저는 통장 알림을 보고 뒤늦게 철이 듭니다. 더 낸 돈이 돌봄 현장 월급으로 정확히 걸어가는 지도부터 보여주세요.",
  },
  "jinju-daily-20260816-beach-final-price": {
    displayName: "파라솔 회계",
    body: "파라솔 하나 빌렸는데 자리비·보관료·모래 감상료까지 가족관계증명서를 떼오네요. 다음엔 가격표보다 계산기부터 방수팩에 넣겠습니다.",
  },
  "jinju-daily-20260816-yasukuni-public-choice": {
    displayName: "사적 출석",
    body: "개인 선택이라기엔 카메라와 직함과 공물이 매년 단체로 출석합니다. 사적인 참배가 이렇게 보도자료처럼 움직이는 건 처음 봅니다.",
  },
  "jinju-daily-20260816-rainy-holiday-camping-refund": {
    displayName: "예약금 퇴실",
    body: "입장은 막고 환불도 막으면 캠핑장은 텐트 대신 돈만 숙박시키는 곳인가요. 제 예약금이라도 안전하게 퇴실시켜주세요.",
  },
  "jinju-daily-20260815-audiobook-walk": {
    displayName: "이어폰 완독",
    body: "귀로 읽었으니 독후감도 음성메시지로 제출하겠습니다. 종이책파가 페이지를 물으면 저는 ‘그 성우가 숨 한번 고른 데요’라고 답할게요.",
  },
  "jinju-morning-20260815-deepfake-ai-surveillance": {
    displayName: "오답 얼굴",
    body: "딥페이크 잡는 AI가 제 증명사진을 보고 ‘본인 불일치’부터 외칠까 걱정됩니다. 범인보다 먼저 평범한 시민 얼굴로 오답노트를 채우지는 말아주세요.",
  },
  "jinju-daily-20260815-phone-only-restaurant-order": {
    displayName: "김치찌개 비번",
    body: "밥 한 끼 먹으러 왔다가 QR 찍고 가입하고 본인인증까지 하면 디저트 전에 입사 지원이 끝나겠습니다. 사장님, 김치찌개는 비밀번호 없이 주세요.",
  },
  "jinju-morning-20260815-smr-near-data-center": {
    displayName: "재부팅 이웃",
    body: "서버는 열받으면 재부팅이라도 하는데 원자로 옆 동네는 전원 버튼이 없습니다. ‘소형’ 두 글자보다 대피로 지도를 더 크게 보여주세요.",
  },
  "jinju-seed-20260716-wedding-money-deleted-contact": {
    displayName: "우정 만기",
    body: "축의금은 송금됐고 우정은 자동이체 해지됐네요. 15년 만기 상품이라 생각하면 이별인데도 이자는 꽤 많이 받으셨을 겁니다.",
  },
  "jinju-seed-20260716-childcare-employment": {
    displayName: "육아 정직원",
    body: "말하면 한다는 남편에게 매일 아침 업무지시서와 야간 당직표를 결재받아야 하나요. 아빠가 육아 정직원인데 자꾸 본인을 친절한 인턴으로 소개하네요.",
  },
  "jinju-proposal-20260716-daangn-fraud-phone": {
    displayName: "고객센터 고고학",
    body: "거래할 땐 당근 이웃, 사기 나면 갑자기 디지털 노숙자가 됩니다. 사람 목소리 한 번 듣겠다고 고객센터 번호를 발굴하는 게 동네생활의 고고학일 줄은 몰랐네요.",
  },
  "jinju-seed-20260716-dating-show-ramen": {
    displayName: "무패 감독",
    body: "34년 무패가 아니라 34년 우천 취소 전승입니다. 소개팅 날엔 라면 국물 말고 대화가 끓어넘치길 바랍니다.",
  },
  "jinju-proposal-20260716-daangn-report-number": {
    displayName: "사건번호 미아",
    body: "택배 수세미도 현재 위치가 나오는데 25만 원짜리 신고는 철학적으로 존재만 하네요. 사건번호 하나 주면 문의도 길을 잃지 않을 텐데요.",
  },
  "jinju-today-20260715-luxury-home-tax": {
    displayName: "원룸 제국",
    body: "100억 집을 한 채뿐이라고 소개하면 제 원룸 보증금도 ‘소형 부동산 제국’이라 불러야겠네요. 1주택이라는 같은 단어 안에 자산 차이가 너무 넓습니다.",
  },
  "jinju-seed-20260716-not-rich-no-worry": {
    displayName: "명세서 휴전",
    body: "부자 목표는 산 정상 같고, 돈 걱정 없는 저녁은 집 앞 평지 같네요. 일단 카드 명세서와 서로 존댓말 하는 사이부터 되어보겠습니다.",
  },
  "jinju-proposal-20260716-no-more-documents": {
    displayName: "행정 퀵기사",
    body: "정부가 발급하고 제가 내려받아 은행에 전달하면 저는 무급 행정 퀵기사입니다. 기관끼리 한 번만 인사하면 제 프린터도 명예퇴직할 수 있어요.",
  },
  "jinju-today-20260715-juvenile-law": {
    displayName: "법률 엘리베이터",
    body: "나이 한 칸 내리는 것만으로 해결되면 법 개정은 엘리베이터 버튼이겠죠. 처벌·피해 회복·재범 방지가 같은 층에 내려야 합니다.",
  },
  "jinju-seed-20260716-junior-better-than-me": {
    displayName: "자존심 업데이트",
    body: "8년 차 자존심이 1년 차에게 수업료 대신 질문 한 번 냈네요. 자존심은 살짝 감가상각됐지만 실력은 최신 버전으로 업데이트됐습니다.",
  },
};

export function topFeedHumorComments(postId: string, createdAt?: string): EditorialComment[] {
  const item = COMMENTS[postId];
  const publishedAt = Date.parse(createdAt ?? "");
  if (!item || !Number.isFinite(publishedAt)) return [];
  return [{
    id: `${postId}-top-feed-humor-20260816`,
    body: item.body,
    displayName: item.displayName,
    createdAt: new Date(publishedAt + 2 * 60_000).toISOString(),
  }];
}
