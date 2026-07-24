import type { EditorialComment, EditorialPost } from "./editorial";

export const launchEditorialPosts: EditorialPost[] = [
  {
    id: "jinju-seed-20260724-peach-slices",
    title: "엄마가 복숭아를 깎아 냉장고에 넣어뒀습니다",
    content: "아침에 냉장고를 열었더니 작은 통에 복숭아 두 쪽이 들어 있었습니다.\n\n별말은 없었는데 출근길에 자꾸 생각났어요.\n\n사랑한다는 말을 과일로 하는 집도 있나 봅니다.",
    category: "일상",
    displayName: "복숭아 두 쪽",
    mode: "털어놓기",
    createdAt: "2026-07-24T07:20:00+09:00",
    updatedAt: "2026-07-24T07:20:00+09:00",
    heard: 38,
    same: 1,
    support: 0,
    commentCount: 1,
  },
  {
    id: "jinju-seed-20260724-four-last-words",
    title: "회의에서 ‘마지막으로’가 네 번 나왔습니다",
    content: "회의의 마지막은 법적 구속력이 없는 표현인가 봅니다.\n\n세 번째 마지막부터는 저도 마음속으로 퇴근했습니다.",
    category: "직장",
    displayName: "마지막의 마지막",
    mode: "털어놓기",
    createdAt: "2026-07-24T07:05:00+09:00",
    updatedAt: "2026-07-24T07:05:00+09:00",
    heard: 62,
    same: 3,
    support: 0,
    commentCount: 1,
  },
  {
    id: "jinju-seed-20260724-growth-arrives-late",
    title: "경제는 성장했다는데 제 통장은 왜 아직 소식을 못 들었을까요",
    content: "경제가 예상보다 성장했다는 뉴스를 봤습니다.\n\n좋은 소식인 건 알겠는데, 장을 보고 카드 명세서를 확인하면 아직 제 생활까지 도착한 소식은 아닌 것 같습니다.\n\n나라의 숫자가 좋아지는 것과 한 사람의 형편이 나아지는 사이에는 얼마나 긴 시간이 필요한 걸까요.",
    category: "사회",
    displayName: "늦게 도착한 성장",
    mode: "의견 묻기",
    createdAt: "2026-07-24T06:50:00+09:00",
    updatedAt: "2026-07-24T06:50:00+09:00",
    heard: 79,
    same: 12,
    support: 0,
    commentCount: 1,
  },
];

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-seed-20260724-peach-slices": [
    {
      id: "launch-comment-peach-1",
      body: "저희 집은 사랑한다는 말을 참외로 합니다. 표현은 서툴러도 당도는 정확하더라고요.",
      displayName: "말없는 과일칼",
      createdAt: "2026-07-24T07:28:00+09:00",
    },
  ],
  "jinju-seed-20260724-four-last-words": [
    {
      id: "launch-comment-last-1",
      body: "회사에서 ‘마지막으로’는 결론이 아니라 다음 안건을 여는 접속사입니다.",
      displayName: "퇴근 문법학자",
      createdAt: "2026-07-24T07:14:00+09:00",
    },
  ],
  "jinju-seed-20260724-growth-arrives-late": [
    {
      id: "launch-comment-growth-1",
      body: "GDP는 뛰었다는데 제 월급은 아직 출발선에서 신발끈 묶는 중입니다. 그래도 방향은 맞았으면 좋겠네요.",
      displayName: "신발끈 묶는 통장",
      createdAt: "2026-07-24T07:02:00+09:00",
    },
  ],
};

export function launchEditorialPost(id: string) {
  return launchEditorialPosts.find((post) => post.id === id) ?? null;
}

export function launchEditorialComments(id: string) {
  return COMMENTS[id] ?? [];
}
