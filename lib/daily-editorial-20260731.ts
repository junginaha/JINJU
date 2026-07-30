import type { EditorialComment, EditorialPost } from "./editorial";

export const july31EditorialPosts: EditorialPost[] = [
  {
    id: "jinju-seed-20260731-public-child-guidance",
    title: "공공장소에서 남의 아이를 조용히 타일러도 될까요",
    content: "도서관에서 아이 둘이 책장 사이를 뛰어다니며 큰 소리로 장난을 쳤습니다.\n\n부모는 조금 떨어진 자리에서 휴대전화를 보고 있었고, 직원도 보이지 않았어요. 아이들에게 “여기서는 조금 조용히 해줄래?”라고 말하려다가 괜한 참견이 될까 봐 그만뒀습니다.\n\n남의 아이를 함부로 혼내는 것은 분명 조심해야 합니다. 하지만 함께 쓰는 공간의 규칙까지 부모만 말할 수 있는 건지도 모르겠어요.\n\n화를 내지 않고 규칙을 알려주는 정도도 부모에게 먼저 허락을 받아야 할까요?",
    category: "질문",
    displayName: "조용한 보호자",
    mode: "의견 묻기",
    createdAt: "2026-07-31T04:39:00+09:00",
    updatedAt: "2026-07-31T04:39:00+09:00",
    heard: 24,
    same: 25,
    support: 0,
    commentCount: 7,
  },
];

const comment = (
  id: string,
  displayName: string,
  body: string,
  createdAt: string,
): EditorialComment => ({ id, displayName, body, createdAt });

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-seed-20260731-public-child-guidance": [
    comment("daily-0731-child-1", "도서관 귀", "아이가 아니라 행동에 대해 차분히 말하는 건 괜찮다고 봅니다. 공동공간의 규칙은 모두가 지켜야 하니까요.", "2026-07-31T04:41:00+09:00"),
    comment("daily-0731-child-2", "아이 엄마", "낯선 어른이 갑자기 말하면 아이가 겁을 먹을 수 있습니다. 가능하면 부모나 직원에게 먼저 알려주세요.", "2026-07-31T04:43:00+09:00"),
    comment("daily-0731-child-3", "책장 사이", "부모에게 말했더니 “애가 그럴 수도 있죠”라고 해서 제가 도서관을 나간 적도 있습니다.", "2026-07-31T04:45:00+09:00"),
    comment("daily-0731-child-4", "낮은 목소리", "“뛰지 마”보다 “여기서는 천천히 걸어줄래?”라고 말하면 덜 공격적으로 들릴 것 같아요.", "2026-07-31T04:47:00+09:00"),
    comment("daily-0731-child-5", "참견 경계", "위험한 행동이 아니라 단순히 시끄러운 정도라면 직원이 대응하는 게 안전합니다.", "2026-07-31T04:49:00+09:00"),
    comment("daily-0731-child-6", "뛰는 운동화", "아이는 뛰고 부모는 휴대전화를 보고, 주변 어른들만 눈으로 비상대책회의를 합니다.", "2026-07-31T04:51:00+09:00"),
    comment("daily-0731-child-7", "공동체 이웃", "아이가 여러 어른에게 예의 있게 규칙을 배우는 것도 나쁘지 않습니다. 다만 모욕하거나 겁주는 말은 절대 안 되겠죠.", "2026-07-31T04:53:00+09:00"),
  ],
};

export function july31EditorialComments(id: string) {
  return COMMENTS[id] ?? [];
}
