import type { EditorialComment, EditorialPost } from "./editorial";

export const august11EditorialPosts: EditorialPost[] = [
  {
    id: "jinju-daily-20260811-anything-menu",
    title: "‘아무거나 먹자’는 친구에게 진짜 아무거나 골랐더니 표정이 바뀌었습니다",
    content: "아무거나 먹자길래 정말 아무거나 하나 골랐는데 친구 표정이 아주 미세하게 굳었습니다.\n\n그제야 알았습니다. 아무거나의 뜻은 ‘내가 싫어하지 않는 것 중에서 네가 센스 있게 골라줘’에 더 가까웠던 것 같습니다.\n\n이럴 때 메뉴를 고른 사람이 잘못인가요, 아무거나라고 한 사람이 책임져야 하나요?",
    category: "관계",
    displayName: "메뉴 고른 사람",
    mode: "의견 묻기",
    createdAt: "2026-08-11T12:30:00+09:00",
    updatedAt: "2026-08-11T12:30:00+09:00",
    heard: 24,
    same: 8,
    support: 0,
    commentCount: 4,
  },
  {
    id: "jinju-daily-20260811-takeout-saving",
    title: "배달비 아끼려고 포장하러 갔다가 간식까지 사 왔습니다",
    content: "배달비 3천 원을 아끼려고 직접 포장하러 나갔습니다.\n\n돌아오는 길에 편의점이 보여서 간식 8천 원어치를 샀고, 결과적으로 돈은 더 썼지만 3천 보는 걸었습니다.\n\n이 정도면 절약인가요, 유산소 쇼핑인가요?",
    category: "돈",
    displayName: "배달비 수호대",
    mode: "털어놓기",
    createdAt: "2026-08-11T12:44:00+09:00",
    updatedAt: "2026-08-11T12:44:00+09:00",
    heard: 31,
    same: 12,
    support: 0,
    commentCount: 4,
  },
];

const comment = (
  id: string,
  displayName: string,
  body: string,
  createdAt: string,
): EditorialComment => ({ id, displayName, body, createdAt });

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-daily-20260811-anything-menu": [
    comment("daily-0811-menu-1", "아무거나 번역가", "아무거나는 메뉴 이름이 아니라 고난도 위임장입니다. 결정권은 넘기지만 거부권은 그대로 보유하는 제도죠.", "2026-08-11T12:36:00+09:00"),
    comment("daily-0811-menu-2", "메뉴 책임론", "아무거나라고 했으면 첫 선택은 일단 존중해야 한다고 봅니다. 싫은 게 있으면 그걸 먼저 말해주는 게 서로 편해요.", "2026-08-11T12:41:00+09:00"),
    comment("daily-0811-menu-3", "점심 협상가", "저희는 이제 ‘싫은 것 두 개씩 말하기’부터 시작합니다. 먹고 싶은 걸 고르는 것보다 싫은 걸 지우는 게 훨씬 빨라요.", "2026-08-11T12:47:00+09:00"),
    comment("daily-0811-menu-4", "미세표정 감별사", "친구도 일부러 그런 건 아닐 겁니다. 사람은 배고프면 취향이 갑자기 헌법처럼 엄격해지더라고요.", "2026-08-11T12:53:00+09:00"),
  ],
  "jinju-daily-20260811-takeout-saving": [
    comment("daily-0811-takeout-1", "걷는 회계사", "현금흐름은 마이너스인데 걸음 수는 플러스네요. 오늘 장부에는 건강자산 취득으로 적어드리겠습니다.", "2026-08-11T12:50:00+09:00"),
    comment("daily-0811-takeout-2", "편의점 우회 실패", "저도 포장하러 나가면 꼭 다른 걸 사 옵니다. 배달비는 절약 대상인데 바깥세상은 소비 기회가 너무 많아요.", "2026-08-11T12:57:00+09:00"),
    comment("daily-0811-takeout-3", "삼천보 시민", "그래도 직접 걸어가서 음식 받아오는 시간이 생각보다 기분 전환이 됩니다. 돈만 보면 실패지만 하루 전체로 보면 꼭 손해는 아닌 것 같아요.", "2026-08-11T13:04:00+09:00"),
    comment("daily-0811-takeout-4", "절약 관찰자", "절약은 한 번의 영수증보다 반복되는 습관이 더 중요하더라고요. 오늘은 간식을 샀어도 배달을 줄이는 습관이 남으면 결국 이득일 수 있습니다.", "2026-08-11T13:12:00+09:00"),
  ],
};

export function august11EditorialComments(id: string) {
  return COMMENTS[id] ?? [];
}
