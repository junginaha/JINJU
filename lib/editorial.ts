export type EditorialPost = {
  id: string;
  category: string;
  createdAt: string;
  title: string;
  content: string;
  heard: number;
  same: number;
  support: number;
  commentCount: number;
};

export const editorialPosts: EditorialPost[] = [
  {
    id: "rested-then-work",
    category: "직장",
    createdAt: "2026-07-20T07:04:00+09:00",
    title: "“잘 쉬셨죠?”라는 말 뒤에는 왜 늘 일이 따라올까요",
    content: "네, 잘 쉬었습니다.\n그래서 다시 쉬고 싶습니다.\n\n월요일 아침의 “잘 쉬셨죠?”는 안부보다 업무 시작 알림에 가깝습니다.\n진심은 한 줄인데, 오늘 할 일은 벌써 화면을 가득 채웠네요.",
    heard: 32, same: 4, support: 0, commentCount: 6,
  },
  {
    id: "coffee-mistake-culture",
    category: "직장",
    createdAt: "2026-07-18T10:30:00+09:00",
    title: "실수한 사람이 커피를 사는 문화, 오늘 제가 끝냈습니다",
    content: "아침 회의 자료에 날짜를 하루 잘못 적었습니다.\n\n별것 아닌데 이상하게 개운합니다. 제 실수는 수정 대상이지 팀 전체 음료 이용권은 아니니까요.\n\n잘못은 바로잡았고 다음부터 확인하겠다고 말했습니다. 커피 대신 체크리스트를 만들었습니다.",
    heard: 55, same: 8, support: 0, commentCount: 0,
  },
  {
    id: "family-chat-photo",
    category: "관계",
    createdAt: "2026-07-19T11:15:00+09:00",
    title: "어머니가 제 사진을 가족 단체방에 올렸습니다",
    content: "주말에 부모님 댁에서 소파에 누워 잠든 적이 있습니다.\n\n결국 사진은 내려갔습니다. 대신 어머니가 서운해하십니다. 제 초상권을 지켰는데 효도가 조금 깎인 기분이네요.\n\n가족이라도 사진을 올리기 전에 한 번 물어봐 주면 좋겠습니다.",
    heard: 63, same: 11, support: 0, commentCount: 0,
  },
  {
    id: "unused-subscriptions",
    category: "돈",
    createdAt: "2026-07-19T12:40:00+09:00",
    title: "안 쓰는 구독을 해지했더니 월급이 조금 자랐습니다",
    content: "통장에서 매달 빠져나가는 돈을 확인했습니다.\n\n연봉은 그대로인데 월급이 몰래 승진한 기분입니다. 그동안 제 통장이 제 가능성까지 구독하고 있었네요.\n\n작지만 다시 내 선택으로 돌아온 돈이 반갑습니다.",
    heard: 71, same: 6, support: 0, commentCount: 0,
  },
  {
    id: "elevator-close-button",
    category: "일상",
    createdAt: "2026-07-19T15:05:00+09:00",
    title: "엘리베이터 닫힘 버튼을 눌렀는데 이웃이 뛰어왔습니다",
    content: "저녁에 장바구니를 양손에 들고 엘리베이터를 탔습니다.\n\n다음에 마주치면 먼저 말하려고 합니다. “그날 제 손가락이 사회생활을 망쳤습니다.”\n\n문이 닫히는 몇 초가 이렇게 오래 기억에 남을 줄 몰랐습니다.",
    heard: 84, same: 3, support: 0, commentCount: 0,
  },
  {
    id: "apartment-broadcast-first",
    category: "제안",
    createdAt: "2026-07-19T19:25:00+09:00",
    title: "아파트 방송은 첫 문장에 용건부터 말해줬으면 합니다",
    content: "밤 아홉 시에 아파트 방송이 나왔습니다.\n\n주민의 관심은 짧고 샴푸 거품은 오래갑니다. 중요한 내용부터 들려주세요.\n\n언제, 어디서, 무엇을 하는지 먼저 말한 다음 설명을 이어가면 좋겠습니다.",
    heard: 68, same: 9, support: 0, commentCount: 0,
  },
];

export function editorialPost(id: string) {
  return editorialPosts.find((post) => post.id === id) ?? null;
}

export function editorialComments(id: string) {
  if (id !== "rested-then-work") return [];
  return [
    ["rested-c01", "접힌 알람", "잘 쉬었냐는 말이 출근 버튼처럼 눌리는 순간이 있죠. 주말은 충전기였는데 월요일이 바로 뽑아갔습니다.", "2026-07-20T07:09:00+09:00"],
    ["rested-c02", "흐린 회의실", "안부처럼 시작해서 업무로 끝나는 문장은 월요일의 대표 특산품입니다.", "2026-07-20T07:13:00+09:00"],
    ["rested-c03", "졸린 책상", "잘 쉰 사람에게 일을 더 얹는 건 배터리 100% 확인하고 바로 고속 방전시키는 느낌이에요.", "2026-07-20T07:17:00+09:00"],
    ["rested-c04", "반쯤 뜬 눈", "저는 잘 쉬었냐고 물으면 마음속으로 아니요, 아직 심사 중입니다 하고 답합니다.", "2026-07-20T07:20:00+09:00"],
    ["rested-c05", "말없는 키보드", "짧은 글인데 월요일 아침 공기가 다 들어 있네요. 웃긴데 조금 피곤합니다.", "2026-07-20T07:23:00+09:00"],
    ["rested-c06", "느긋한 출근길", "쉬었다는 사실이 바로 노동 가능 판정으로 이어지는 구조가 제일 무섭습니다.", "2026-07-20T07:26:00+09:00"],
  ].map(([commentId, displayName, body, createdAt]) => ({ id: commentId, displayName, body, createdAt }));
}
