import type { EditorialComment } from "./editorial";

export const AUGUST8_FRESH_COMMENT_POST_IDS = [
  "jinju-morning-20260808-high-school-baseball-heat",
  "jinju-morning-20260808-special-school-admission",
  "jinju-morning-20260808-bus-housing",
  "jinju-seed-20260807-vacation-books-three",
  "jinju-seed-20260806-bookclub-eighteen-questions",
  "jinju-morning-20260806-coworker-name-respect",
  "303t1k08482d6n4q5x4b",
  "jinju-morning-20260806-palace-admission-fee",
  "jinju-seed-20260806-ev-charger-overnight",
  "jinju-morning-20260806-ai-emergency-triage",
] as const;

const comment = (
  postId: string,
  index: number,
  displayName: string,
  body: string,
  createdAt: string,
): EditorialComment => ({
  id: `fresh-0808-${postId}-${index}`,
  displayName,
  body,
  createdAt,
});

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-morning-20260808-high-school-baseball-heat": [
    comment("jinju-morning-20260808-high-school-baseball-heat", 1, "응원 수건", "응원 수건을 흔들기보다 선수들 그늘을 만드는 데 쓰고 싶은 날씨네요. 일정은 다시 잡아도 건강은 재경기가 안 됩니다.", "2026-08-08T13:20:00+09:00"),
    comment("jinju-morning-20260808-high-school-baseball-heat", 2, "새벽 타자", "선수들은 땀을 참으며 기회를 지키고, 어른들은 시간을 조정하며 선수를 지켜야죠. 야구는 9회까지지만 몸은 졸업 뒤에도 계속 써야 합니다.", "2026-08-08T13:25:00+09:00"),
  ],
  "jinju-morning-20260808-special-school-admission": [
    comment("jinju-morning-20260808-special-school-admission", 1, "등교 지도", "입학 정보를 찾는 부모들끼리 비공식 상담사가 되어버린다는 게 마음 아파요. 학교가 먼저 자리와 절차를 한눈에 보여주면 좋겠습니다.", "2026-08-08T13:11:00+09:00"),
    comment("jinju-morning-20260808-special-school-admission", 2, "책가방 대기", "책가방보다 대기표를 먼저 준비하는 입학이라니 마음이 무겁네요. 첫 등굣길만큼은 부모도 아이도 조금 덜 긴장했으면 좋겠습니다.", "2026-08-08T13:16:00+09:00"),
  ],
  "jinju-morning-20260808-bus-housing": [
    comment("jinju-morning-20260808-bus-housing", 1, "차고지 이웃", "버스가 잠시 비를 피하는 집은 될 수 있어도 청년의 종착지는 아니었으면 해요. 다음 집으로 가는 노선표까지 같이 주는 정책이면 응원하겠습니다.", "2026-08-08T13:07:00+09:00"),
    comment("jinju-morning-20260808-bus-housing", 2, "창문 커튼", "침대와 화장실, 단열이 제대로라면 급한 며칠에는 꽤 든든할 수 있죠. 다만 월세가 버스요금처럼 계속 오르지만 않았으면 합니다.", "2026-08-08T13:12:00+09:00"),
  ],
  "jinju-seed-20260807-vacation-books-three": [
    comment("jinju-seed-20260807-vacation-books-three", 1, "책갈피 휴가", "저는 책을 펼쳐둔 채 낮잠만 아주 성실하게 잤습니다. 독서는 실패했지만 책이 베개 옆 풍경은 제대로 맡아줬어요.", "2026-08-08T13:04:00+09:00"),
    comment("jinju-seed-20260807-vacation-books-three", 2, "한장 독자", "다 읽겠다는 계획 대신 하루 한 장만 펴보니 오히려 몇 쪽 더 읽게 되더라고요. 못 읽은 책도 여행 다녀온 표정이라 괜히 반갑고요.", "2026-08-08T13:09:00+09:00"),
  ],
  "jinju-seed-20260806-bookclub-eighteen-questions": [
    comment("jinju-seed-20260806-bookclub-eighteen-questions", 1, "네번째 답", "세 번째 질문쯤 되면 제 생각보다 종료 시간을 더 깊이 고민하게 됩니다. 핵심 세 개만 고르고 나머지는 대화가 조용할 때 꺼내면 좋겠어요.", "2026-08-08T12:58:00+09:00"),
    comment("jinju-seed-20260806-bookclub-eighteen-questions", 2, "토론 간식", "질문 열여덟 개면 간식도 열여덟 종류는 있어야 공평합니다. 답을 다 채우기보다 한 질문에서 예상 밖의 이야기를 듣는 모임이 더 기억에 남더라고요.", "2026-08-08T13:03:00+09:00"),
  ],
  "jinju-morning-20260806-coworker-name-respect": [
    comment("jinju-morning-20260806-coworker-name-respect", 1, "첫인사 동료", "제 이름을 천천히 한 번 더 물어봐 준 사람이 오래 기억에 남았습니다. 발음이 서툴러도 존중은 꽤 또렷하게 들리더라고요.", "2026-08-08T12:54:00+09:00"),
    comment("jinju-morning-20260806-coworker-name-respect", 2, "현장 메모", "처음에는 이름 옆에 발음까지 메모해두면 됩니다. 세 번쯤 제대로 불러주면 서로의 표정이 먼저 출근하더라고요.", "2026-08-08T12:59:00+09:00"),
  ],
  "303t1k08482d6n4q5x4b": [
    comment("303t1k08482d6n4q5x4b", 1, "통근 영수증", "출퇴근 거리만 늘어난 줄 알았는데 세금까지 따라오면 이사는 두 번 하는 기분이겠어요. 직장 이동으로 비거주한 경우는 안내와 소명이 간단했으면 합니다.", "2026-08-08T13:14:00+09:00"),
    comment("303t1k08482d6n4q5x4b", 2, "전세 신발", "내 집은 한 곳인데 평일 신발은 전셋집 현관에 있네요. 실거주를 주소 하나로만 자르면 이런 생활은 설명할 칸이 없습니다.", "2026-08-08T13:19:00+09:00"),
  ],
  "jinju-morning-20260806-palace-admission-fee": [
    comment("jinju-morning-20260806-palace-admission-fee", 1, "돌담 간식", "궁궐 한 바퀴 돌고 나오면 입장료보다 간식값이 더 많이 나오더라고요. 조금 오르더라도 수리한 곳과 무료 개방일을 같이 알려주면 흔쾌히 낼 것 같아요.", "2026-08-08T12:48:00+09:00"),
    comment("jinju-morning-20260806-palace-admission-fee", 2, "기와 후원", "궁궐은 아이에게 도시 한복판에서 시간여행을 시켜주는 곳이라 자주 열려 있어야 해요. 입장료를 올려도 동네 주민이 산책하듯 오는 연간권이 있으면 좋겠습니다.", "2026-08-08T12:53:00+09:00"),
  ],
  "jinju-seed-20260806-ev-charger-overnight": [
    comment("jinju-seed-20260806-ev-charger-overnight", 1, "새벽 슬리퍼", "새벽 두 시 알림에 슬리퍼를 신고 내려가 본 사람은 차주 사정도 알 겁니다. 밤에는 한 번 양보하고 아침까지 그대로면 알려주는 정도가 마음 편하겠어요.", "2026-08-08T12:43:00+09:00"),
    comment("jinju-seed-20260806-ev-charger-overnight", 2, "충전 순번", "차를 제때 옮긴 분께 다음 대기자가 고맙다는 스티커라도 주면 분위기가 달라질까요. 벌금만큼 작은 칭찬도 사람을 꽤 잘 움직이더라고요.", "2026-08-08T12:48:00+09:00"),
  ],
  "jinju-morning-20260806-ai-emergency-triage": [
    comment("jinju-morning-20260806-ai-emergency-triage", 1, "숨고른 전화", "AI가 틀렸을 때 바로 사람이 순서를 바꿀 수 있어야 안심되죠. 똑똑함보다 빠른 정정 버튼이 먼저인 시스템이었으면 합니다.", "2026-08-08T12:38:00+09:00"),
    comment("jinju-morning-20260806-ai-emergency-triage", 2, "연결음 없는", "위급한 순간엔 안내 음악 한 소절도 길게 느껴지죠. AI가 사람을 대신하기보다 통화 대기줄을 정리하는 조용한 안내원이면 좋겠습니다.", "2026-08-08T12:43:00+09:00"),
  ],
};

export function august8FreshComments(postId: string): EditorialComment[] {
  return COMMENTS[postId] ?? [];
}
