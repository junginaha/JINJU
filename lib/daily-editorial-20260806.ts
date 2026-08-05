import type { EditorialComment, EditorialPost } from "./editorial";

export const august6EditorialPosts: EditorialPost[] = [
  {
    id: "jinju-seed-20260806-ev-charger-overnight",
    title: "충전이 끝난 전기차를 밤새 세워둬도 될까요",
    content: "아파트 전기차 충전기가 늘 부족합니다.\n\n어젯밤에는 한 차량의 충전이 이미 끝났는데도 아침까지 그대로 세워져 있어 다른 주민들이 이용하지 못했어요.\n\n차주는 밤늦게 충전이 끝날 때마다 내려와 차를 옮기기는 어렵다고 합니다. 일반 주차공간이 부족하다는 사정도 있고요.\n\n충전이 끝난 자리는 바로 비워야 할까요? 밤에는 일정 시간까지 주차를 허용해야 할까요?",
    category: "사회",
    displayName: "충전 대기",
    mode: "의견 묻기",
    createdAt: "2026-08-06T14:10:00+09:00",
    updatedAt: "2026-08-06T14:10:00+09:00",
    heard: 29,
    same: 23,
    support: 0,
    commentCount: 6,
  },
  {
    id: "jinju-seed-20260806-bookclub-eighteen-questions",
    title: "발제 질문이 열여덟 개인 북클럽, 토론일까요 구술시험일까요",
    content: "이번 북클럽 발제자가 질문을 열여덟 개 준비해왔습니다.\n\n책을 정말 꼼꼼히 읽은 정성이 느껴졌지만, 한 질문에 이야기가 깊어질 만하면 ‘다음 질문으로 넘어갈게요’라는 말이 나왔어요.\n\n모임이 끝날 무렵에는 모두 긴 대답보다 정답처럼 짧은 말을 찾고 있었습니다. 책을 읽으러 왔는데 구술시험을 치른 기분도 들었고요.\n\n북클럽에는 촘촘한 발제가 필요할까요? 좋은 질문 몇 개만 두고 대화가 흘러가게 해야 할까요?",
    category: "질문",
    displayName: "질문 과다",
    mode: "의견 묻기",
    createdAt: "2026-08-06T20:15:00+09:00",
    updatedAt: "2026-08-06T20:15:00+09:00",
    heard: 32,
    same: 16,
    support: 0,
    commentCount: 6,
  },
];

const comment = (
  id: string,
  displayName: string,
  body: string,
  createdAt: string,
): EditorialComment => ({ id, displayName, body, createdAt });

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-seed-20260806-ev-charger-overnight": [
    comment("daily-0806-charger-1", "주차 대기", "충전기는 주차장이 아니라 연료를 채우는 시설입니다. 충전이 끝났다면 다른 차량을 위해 이동해야죠.", "2026-08-06T14:14:00+09:00"),
    comment("daily-0806-charger-2", "밤샘 충전", "새벽에 충전이 끝났다고 바로 내려오라는 것도 현실적이지 않습니다. 야간에는 몇 시간의 유예가 필요해요.", "2026-08-06T14:21:00+09:00"),
    comment("daily-0806-charger-3", "완충 알림", "앱으로 알림을 보내고 유예시간 뒤에는 추가요금을 받으면 자연스럽게 자리가 돌 것 같습니다.", "2026-08-06T14:29:00+09:00"),
    comment("daily-0806-charger-4", "케이블 수호", "배터리는 100%인데 주차 배려는 아직 12% 충전 중이네요.", "2026-08-06T14:38:00+09:00"),
    comment("daily-0806-charger-5", "아파트 규칙", "개인의 양심에만 맡기지 말고 야간·주간 이동 기준을 주민투표로 정해야 합니다.", "2026-08-06T14:48:00+09:00"),
    comment("daily-0806-charger-6", "전기차 주인", "주민끼리 싸우기 전에 충전기 수부터 늘려야죠. 부족한 시설의 책임을 사용자끼리 나누고 있습니다.", "2026-08-06T14:59:00+09:00"),
  ],
  "jinju-seed-20260806-bookclub-eighteen-questions": [
    comment("daily-0806-bookclub-1", "발제 열정", "질문을 많이 준비한 정성은 고맙지만 모두 사용할 필요는 없습니다. 중요한 질문을 고르는 것도 발제라고 생각해요.", "2026-08-06T20:19:00+09:00"),
    comment("daily-0806-bookclub-2", "대답 공포", "책은 열두 장인데 질문이 열여덟 개였습니다. 작가보다 발제자가 저를 더 많이 평가하네요.", "2026-08-06T20:26:00+09:00"),
    comment("daily-0806-bookclub-3", "자유 토론", "좋은 질문 하나에서 예상하지 못한 이야기가 나오는 것이 북클럽의 재미입니다. 깊이가 개수보다 중요해요.", "2026-08-06T20:34:00+09:00"),
    comment("daily-0806-bookclub-4", "완독 참가", "질문이 없으면 책 이야기는 사라지고 각자의 직장과 연애 이야기만 남기도 합니다. 어느 정도 구조는 필요합니다.", "2026-08-06T20:43:00+09:00"),
    comment("daily-0806-bookclub-5", "질문 다이어트", "핵심 질문 세 개와 대화가 끊길 때 사용할 예비 질문 몇 개면 충분할 것 같아요.", "2026-08-06T20:53:00+09:00"),
    comment("daily-0806-bookclub-6", "조용한 독자", "즉흥적으로 말하기 어려운 사람에게는 미리 받은 질문이 도움이 됩니다. 질문 수보다 사전 공유가 중요해요.", "2026-08-06T21:04:00+09:00"),
  ],
};

export function august6EditorialComments(id: string) {
  return COMMENTS[id] ?? [];
}
