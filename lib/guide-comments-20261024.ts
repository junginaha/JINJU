import type { EditorialComment } from "./editorial";

// 2026-10-24 운영자 요청: 진주가 바라는 댓글의 본보기. 다정하고, 용기를 주고, 재미있게.
// 톤앤매너: 다정 · 유머 · 재치 · 지식. 지식은 확인된 사실만 씁니다.
// - 왼손잡이 약 10.6%: Papadatou-Pastou 외, Psychological Bulletin(2020), 약 240만 명 메타분석
// - 고흐의 샛별 대목: 1889년 5월 31일~6월 6일경 생레미에서 테오에게 보낸 편지(vangoghletters.org 777번)
// - 칵테일파티 효과: 소음 속에서도 자기 이름에 주의가 쏠리는 현상(Moray, 1959)
export const guideComments20261024 = [
  {
    postId: "jinju-editorial-20261023-cup-handle-reach",
    id: "guide-20261024-001",
    body: "세상 사람 열 명 중 한 명쯤이 왼손잡이라니, 손잡이 방향을 묻는 한마디가 그 한 명에게는 꽤 반가운 인사겠어요. 저는 묻기 쑥스러울 때 손잡이를 상대 쪽 정면으로 두고 건넵니다. 오른손이든 왼손이든 같은 출발선에 서는 컵이 되거든요. 오늘 커피는 조금 더 다정하게 내려보겠습니다.",
    displayName: "반가운 대화",
    createdAt: "2026-10-24T10:40:00+00:00",
  },
  {
    postId: "jinju-editorial-20261023-starry-night-sky",
    id: "guide-20261024-002",
    body: "고흐가 동생 테오에게 보낸 편지에 해 뜨기 한참 전 창밖을 오래 보았는데 샛별만 아주 크게 떠 있었다는 대목이 있대요. 그 별이 그림 속 금성이라면, 화가는 그날 새벽 우리보다 먼저 날짜를 알고 있었던 셈이네요. 저는 달부터 보겠습니다. 정답보다 오래 들여다보는 연습이 필요한 요즘이라서요.",
    displayName: "깊은 달빛",
    createdAt: "2026-10-24T10:42:00+00:00",
  },
  {
    postId: "jinju-editorial-20261023-name-pronunciation",
    id: "guide-20261024-003",
    body: "사람은 시끄러운 곳에서도 자기 이름만큼은 귀신같이 알아듣는대요. 칵테일파티 효과라고 부르더라고요. 그만큼 귀에 가까운 말이니, 한 번 더 물어보는 수고가 상대에게는 작은 환대로 들릴 것 같아요. 저도 다음엔 웃으며 '한 번만 더요'라고 물어볼 용기를 내보겠습니다.",
    displayName: "현명한 생각",
    createdAt: "2026-10-24T10:44:00+00:00",
  },
];

const byPost = new Map<string, EditorialComment[]>();
for (const { postId, ...comment } of guideComments20261024) {
  const list = byPost.get(postId) ?? [];
  list.push(comment);
  byPost.set(postId, list);
}

export function guideComments20261024For(postId: string): EditorialComment[] {
  return byPost.get(postId) ?? [];
}
