import type { EditorialComment, EditorialPost } from "./editorial";

export const august7EditorialPosts: EditorialPost[] = [
  {
    id: "jinju-seed-20260807-vacation-books-three",
    title: "2박 3일 여행에 책 세 권을 챙겼습니다. 제가 제일 무거웠습니다",
    content: "휴가를 가면서 이번에는 정말 책을 읽겠다고 마음먹었습니다. 2박 3일인데 책은 세 권을 챙겼습니다. 한 권은 소설, 한 권은 에세이, 한 권은 혹시 몰라서였습니다.\n\n비행기에서는 잤고, 카페에서는 사진을 찍었고, 숙소에서는 휴대폰을 봤습니다. 책 세 권은 여행 내내 제 어깨와 함께 성실하게 이동만 했습니다.\n\n집에 돌아와 가방에서 책을 꺼내는데 문득 궁금해졌어요. 여행 갈 때 책을 챙기는 건 독서 계획일까요, 아니면 여행 중에도 괜찮은 사람이 되고 싶은 마음일까요?\n\n다음 여행에도 저는 또 책을 넣을 것 같습니다. 여러분은 휴가 갈 때 책을 몇 권 챙기시나요?",
    category: "질문",
    displayName: "여행 가방 독자",
    mode: "의견 묻기",
    createdAt: "2026-08-07T10:25:00+09:00",
    updatedAt: "2026-08-07T10:25:00+09:00",
    heard: 20,
    same: 0,
    support: 0,
    commentCount: 5,
  },
];

const comment = (
  id: string,
  displayName: string,
  body: string,
  createdAt: string,
): EditorialComment => ({ id, displayName, body, createdAt });

const COMMENTS: Record<string, EditorialComment[]> = {
  "jinju-seed-20260807-vacation-books-three": [
    comment("daily-0807-vacationbook-1", "한 권만 챙기는 사람", "저는 이제 무조건 한 권만 가져갑니다. 못 읽어도 괜찮고, 읽으면 여행지에서 만난 문장 하나가 오래 남더라고요.", "2026-08-07T10:25:10+09:00"),
    comment("daily-0807-vacationbook-2", "가방 무게 담당", "세 권 중 한 권은 읽을 책, 한 권은 읽고 싶은 나, 한 권은 절대 읽지 않을 보험용 같습니다. 제 캐리어에도 늘 같은 세 사람이 탑니다.", "2026-08-07T10:25:30+09:00"),
    comment("daily-0807-vacationbook-3", "호텔 독서 실패", "저도 숙소 조명 보면서 오늘 밤은 읽겠다 싶다가 침대에 눕는 순간 휴대폰부터 켭니다. 여행에서는 책보다 사람이 먼저 풀어지는 것 같아요.", "2026-08-07T10:25:50+09:00"),
    comment("daily-0807-vacationbook-4", "기차 창가 독자", "그래도 책을 챙기는 행동 자체가 저는 좋습니다. 여행 중 우연히 생긴 한 시간에 읽을 게 있다는 건 생각보다 든든해요.", "2026-08-07T10:26:10+09:00"),
    comment("daily-0807-vacationbook-5", "북클럽 짐꾼", "북클럽 여행이면 더 위험합니다. 다들 책을 들고 와서 결국 메뉴판만 제일 열심히 읽거든요. 그래도 다음 여행 때 또 챙길 겁니다.", "2026-08-07T10:26:30+09:00"),
  ],
};

export function august7EditorialComments(id: string) {
  return COMMENTS[id] ?? [];
}
