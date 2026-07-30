import type { EditorialComment, EditorialPost } from "./editorial";

export const bookclubEditorialPosts: EditorialPost[] = [
  {
    id: "jinju-bookclub-20260730-bill-bryson",
    title: "빌 브라이슨을 읽었는데 우주보다 책이 더 무거웠습니다",
    content: "빌 브라이슨의 『거의 모든 것의 역사』를 읽기로 했습니다.\n\n우주의 탄생부터 인간의 역사까지 이해해보겠다는 원대한 계획이었는데, 책을 펼치기도 전에 손목에서 먼저 문명의 위기를 느꼈습니다. 침대에서 읽다가 얼굴에 떨어뜨린 뒤로는 우주보다 중력이 더 잘 이해됩니다.\n\n북클럽에 가보니 회원들이 세 부류로 나뉘었습니다. 끝까지 읽은 사람, 중간까지 읽고도 끝까지 읽은 표정을 짓는 사람, 책을 가방에 넣고 다닌 것만으로 지식을 흡수했다고 믿는 사람입니다.\n\n저는 63쪽까지 읽었지만 이제 누가 아무 말이나 하면 “그건 지질학적으로 조금 다르게 봐야 합니다”라고 말할 수 있게 됐습니다.\n\n책 한 권을 다 읽지 않아도 사람이 이렇게 거만해질 수 있다면, 완독은 너무 위험한 일 아닐까요?",
    category: "일상",
    displayName: "손목 지식인",
    mode: "의견 묻기",
    createdAt: "2026-07-30T13:50:00+09:00",
    updatedAt: "2026-07-30T13:50:00+09:00",
    heard: 32,
    same: 14,
    support: 0,
    commentCount: 6,
  },
];

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-bookclub-20260730-bill-bryson": [
    {
      id: "bookclub-0730-bryson-1",
      displayName: "중력 체험자",
      body: "책을 얼굴에 떨어뜨리는 순간 이론이 실습으로 바뀝니다. 빌 브라이슨식 독서에는 안전모가 필요해요.",
      createdAt: "2026-07-30T13:52:00+09:00",
    },
    {
      id: "bookclub-0730-bryson-2",
      displayName: "가방 완독자",
      body: "한 달 동안 들고 다녔습니다. 내용은 모르지만 어깨 근육은 거의 모든 것을 기억합니다.",
      createdAt: "2026-07-30T13:54:00+09:00",
    },
    {
      id: "bookclub-0730-bryson-3",
      displayName: "지질학 권위자",
      body: "50쪽 읽고 가족 식탁에서 대륙 이동을 설명했습니다. 가족들은 제 의자를 현관 쪽으로 이동시켰습니다.",
      createdAt: "2026-07-30T13:56:00+09:00",
    },
    {
      id: "bookclub-0730-bryson-4",
      displayName: "우주 중도하차",
      body: "우주의 탄생은 읽었는데 인류가 등장하기 전에 제가 먼저 멸종했습니다.",
      createdAt: "2026-07-30T13:58:00+09:00",
    },
    {
      id: "bookclub-0730-bryson-5",
      displayName: "완독한 허리",
      body: "책은 거의 모든 것의 역사인데 제 독서 기록은 거의 아무것도 없는 역사입니다.",
      createdAt: "2026-07-30T14:00:00+09:00",
    },
    {
      id: "bookclub-0730-bryson-6",
      displayName: "다음달 사회자",
      body: "완독한 사람은 한 명뿐인데 나머지 일곱 명이 그분의 해석에 반대했습니다. 이것이 민주주의의 역사입니다.",
      createdAt: "2026-07-30T14:02:00+09:00",
    },
  ],
};

export function bookclubEditorialComments(id: string) {
  return COMMENTS[id] ?? [];
}
