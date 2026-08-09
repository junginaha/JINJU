import type { EditorialComment } from "./editorial";

export const AUGUST9_FRESH_COMMENT_POST_IDS = [
  "jinju-morning-20260808-police-family-case-transfer",
  "jinju-morning-20260808-semiconductor-work-hours",
  "jinju-morning-20260808-high-school-baseball-heat",
  "jinju-morning-20260808-special-school-admission",
  "jinju-morning-20260808-bus-housing",
  "jinju-seed-20260807-vacation-books-three",
  "jinju-seed-20260806-bookclub-eighteen-questions",
  "jinju-morning-20260806-coworker-name-respect",
  "303t1k08482d6n4q5x4b",
  "jinju-morning-20260806-palace-admission-fee",
] as const;

const comment = (
  postId: string,
  displayName: string,
  body: string,
  createdAt: string,
): EditorialComment => ({
  id: `fresh-0809-${postId}`,
  displayName,
  body,
  createdAt,
});

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-morning-20260808-police-family-case-transfer": [
    comment("jinju-morning-20260808-police-family-case-transfer", "서류 출장", "사건이 옆 동네로 출장 가더라도 초동 대응까지 택시를 기다리면 안 되겠죠. 공정성은 멀리 보내고 긴급조치는 가까이 두면 좋겠습니다.", "2026-08-09T08:20:00+09:00"),
  ],
  "jinju-morning-20260808-semiconductor-work-hours": [
    comment("jinju-morning-20260808-semiconductor-work-hours", "야근 나노", "회로는 더 작아지는데 근무시간만 커지면 기술 발전 방향이 조금 이상합니다. 유연함 뒤에 보상과 다음 날 휴식도 같이 붙여주세요.", "2026-08-09T08:21:00+09:00"),
  ],
  "jinju-morning-20260808-high-school-baseball-heat": [
    comment("jinju-morning-20260808-high-school-baseball-heat", "그늘 불펜", "선수 교체 전에 경기 시간부터 교체했으면 합니다. 승부는 연장전에 가도 되지만 체온은 규정 이닝이 없어요.", "2026-08-09T08:22:00+09:00"),
  ],
  "jinju-morning-20260808-special-school-admission": [
    comment("jinju-morning-20260808-special-school-admission", "가방 대기표", "아이 책가방보다 부모의 입학 정보 파일이 더 두꺼워지는 현실이네요. 학교 자리는 운 좋게 얻는 티켓이 아니라 동네마다 준비된 권리였으면 합니다.", "2026-08-09T08:23:00+09:00"),
  ],
  "jinju-morning-20260808-bus-housing": [
    comment("jinju-morning-20260808-bus-housing", "종점 세입자", "바퀴 달린 집이 출근길까지 줄여주면 잠깐 혹할 것 같긴 합니다. 그래도 임시 정류장 뒤에 제대로 된 집으로 가는 다음 노선이 꼭 있어야죠.", "2026-08-09T08:24:00+09:00"),
  ],
  "jinju-seed-20260807-vacation-books-three": [
    comment("jinju-seed-20260807-vacation-books-three", "캐리어 사서", "책 세 권은 독서에 실패한 게 아니라 숙소와 카페를 충실히 관광했습니다. 다음엔 한 권만 데려가서 책에게도 자유시간을 주세요.", "2026-08-09T08:25:00+09:00"),
  ],
  "jinju-seed-20260806-bookclub-eighteen-questions": [
    comment("jinju-seed-20260806-bookclub-eighteen-questions", "예비 답안", "질문 열여덟 개면 발제문보다 답안지부터 제본해야겠네요. 깊게 남는 질문 셋과 모임을 살리는 간식 하나면 충분할 것 같습니다.", "2026-08-09T08:26:00+09:00"),
  ],
  "jinju-morning-20260806-coworker-name-respect": [
    comment("jinju-morning-20260806-coworker-name-respect", "이름 연습", "첫날 세 번 틀려도 다섯째 날 이름을 불러주면 표정이 달라집니다. 이름은 가장 비용이 적게 드는 복지인데 효과는 꽤 오래가요.", "2026-08-09T08:27:00+09:00"),
  ],
  "303t1k08482d6n4q5x4b": [
    comment("303t1k08482d6n4q5x4b", "두집 달력", "세법 계산기에는 집이 한 칸인데 제 생활은 회사 근처와 가족 집 두 칸이네요. 숫자가 사람보다 단순한 만큼 소명 창구는 사람답게 넓었으면 합니다.", "2026-08-09T08:28:00+09:00"),
  ],
  "jinju-morning-20260806-palace-admission-fee": [
    comment("jinju-morning-20260806-palace-admission-fee", "기와 산책", "입장료가 오르더라도 기와 한 장이 더 오래 버틴다는 영수증이 보이면 덜 아깝겠습니다. 산책 단골용 연간권도 있으면 왕보다 자주 출근할 자신 있어요.", "2026-08-09T08:29:00+09:00"),
  ],
};

export function august9FreshComments(postId: string): EditorialComment[] {
  return COMMENTS[postId] ?? [];
}
