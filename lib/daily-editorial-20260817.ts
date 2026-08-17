import type { EditorialComment, EditorialPost } from "./editorial";

export const august17EditorialPosts: EditorialPost[] = [
  {
    id: "jinju-daily-20260817-unused-purchase",
    title: "사놓고 한 번도 안 쓴 물건, 뭐였나요?",
    content: "정리하다가 상자도 안 뜯은 미니 빔프로젝터를 발견했습니다. 살 때는 주말마다 벽에 영화관을 열 줄 알았는데 실제 주말의 저는 소파에서 휴대폰을 보고 있었네요. 여러분 집에도 결제할 때의 나와 살아가는 내가 서로 합의하지 못한 물건 하나쯤 있나요?",
    category: "돈",
    displayName: "상자 발굴",
    mode: "의견 묻기",
    createdAt: "2026-08-17T15:10:00+09:00",
    updatedAt: "2026-08-17T15:10:00+09:00",
    heard: 22,
    same: 14,
    support: 0,
    commentCount: 0,
  },
  {
    id: "jinju-daily-20260817-tiring-rest",
    title: "쉬러 갔다가 더 지쳐 돌아온 날",
    content: "연휴에 제대로 쉬어보겠다고 맛집 두 곳과 전시 하나, 카페까지 시간표에 넣었습니다. 마지막 카페에서는 사진만 찍고 집에 가고 싶다는 생각뿐이어서 웃음이 났어요. 여러분도 휴식에 너무 열심이어서 차라리 평범한 하루가 그리웠던 적 있나요?",
    category: "일상",
    displayName: "휴일 과장",
    mode: "털어놓기",
    createdAt: "2026-08-17T18:20:00+09:00",
    updatedAt: "2026-08-17T18:20:00+09:00",
    heard: 24,
    same: 17,
    support: 0,
    commentCount: 0,
  },
  {
    id: "jinju-daily-20260817-one-no-made-life-easier",
    title: "한 번 거절했더니 이상하게 삶이 편해졌습니다",
    content: "늘 제가 맡던 모임 예약을 이번에는 어렵다고 처음 말했습니다. 서운해할까 하루 종일 신경 썼는데 다른 사람이 십 분 만에 예약했고 모임도 멀쩡히 열렸어요. 내가 꼭 해야 한다고 믿었지만 사실 아무도 그렇게 정한 적 없었던 일, 여러분에게도 있었나요?",
    category: "관계",
    displayName: "거절 연습",
    mode: "털어놓기",
    createdAt: "2026-08-17T21:10:00+09:00",
    updatedAt: "2026-08-17T21:10:00+09:00",
    heard: 21,
    same: 18,
    support: 0,
    commentCount: 0,
  },
];

export function august17EditorialComments(_id: string): EditorialComment[] {
  return [];
}
