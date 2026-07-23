import { db, hash } from "./db";

export type AutoCommentPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
};

const COMMENT_OFFSETS_MS = [
  6 * 60_000,
  17 * 60_000,
] as const;

export function autoCommentSchedule(postCreatedAt: string) {
  const parsed = Date.parse(postCreatedAt);
  const postTime = Number.isFinite(parsed) ? parsed : Date.now();
  return COMMENT_OFFSETS_MS.map((offset) => new Date(postTime + offset).toISOString());
}

const ADJECTIVES = [
  "열린", "비스듬한", "잠깐 웃는", "오래 듣는", "햇빛 든", "생각 깊은", "다정한", "또렷한",
  "조용히 고개 든", "한숨 돌린", "느긋한", "마음 놓인", "새벽을 건넌", "말을 아낀", "살짝 웃는", "천천히 읽는",
];

const NOUNS = [
  "대문", "연필깎이", "찻잔", "여백", "골목", "책갈피", "라디오", "손잡이",
  "우체통", "신호등", "창문", "구두끈", "메모지", "종이배", "가로등", "정류장",
];

function hashNumber(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function nickname(postId: string, index: number) {
  const seed = hashNumber(`${postId}:${index}:comment-name`);
  return `${ADJECTIVES[seed % ADJECTIVES.length]} ${NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length]}`;
}

const CATEGORY_COMMENTS: Record<string, [string, string]> = {
  일상: [
    "이거 저도 해봤어요 ㅋㅋ 다들 비슷하게 사는구나 싶네요.",
    "별일 아닌데 이런 게 하루 종일 생각날 때 있죠.",
  ],
  관계: [
    "저도 비슷한 일 있었어요. 그때 바로 말 못 한 게 오래 남더라고요.",
    "좋아하는 마음이랑 서운한 마음은 같이 생기기도 하죠.",
  ],
  직장: [
    "우리 회사 얘긴 줄 알았어요 ㅋㅋ 웃기지만 매일 겪으면 진짜 지칩니다.",
    "저도 그 자리에서는 아무 말 못 하고 퇴근길에 할 말이 다 생각나더라고요.",
  ],
  돈: [
    "몇천 원은 작다는데 왜 늘 제 통장에서만 사라지는지 모르겠어요 ㅋㅋ",
    "저도 결제 내역 열어봤다가 생각보다 커서 조용히 닫았습니다.",
  ],
  사회: [
    "뉴스로 볼 땐 한 줄인데 실제로 겪는 사람은 하루가 통째로 흔들리겠네요.",
    "취지는 알겠는데 현장에서 어떻게 되는지부터 보고 싶어요.",
  ],
  제안: [
    "이거 생기면 저부터 씁니다. 왜 아직 없었나 싶네요.",
    "거창한 기능보다 이런 불편 하나 고쳐주는 게 더 반갑더라고요.",
  ],
  질문: [
    "처음엔 한쪽이라고 생각했는데 읽고 나니 좀 헷갈리네요.",
    "저는 아직 반반이에요. 다른 분들 생각도 궁금합니다.",
  ],
};

const TOPIC_COMMENTS: Array<{ match: RegExp; comments: [string, string] }> = [
  { match: /답장|읽씹/, comments: ["답장 미루다 사과문부터 쓰게 되는 거 저만 그런 줄 알았어요 ㅠ", "완벽하게 쓰려다 아예 못 보내는 날이 있죠."] },
  { match: /AI|인공지능/, comments: ["편해진 건 맞는데 왜 저는 전보다 더 바쁜지 모르겠어요 ㅋㅋ", "결국 어디까지 맡길지는 사람이 정해야 하는 것 같아요."] },
  { match: /회식/, comments: ["자유 참석이라면서 안 가면 이유 묻는 순간 자유는 끝이죠.", "가끔은 재밌는데 매번 좋아해야 하는 분위기가 더 피곤해요."] },
  { match: /월급|통장|생활비|구독/, comments: ["저도 결제 내역 열어봤다가 생각보다 커서 조용히 닫았습니다.", "돈 들어온 날보다 빠져나가는 날이 더 또렷하더라고요."] },
  { match: /엄마|아빠|부모|가족/, comments: ["가족 일은 고마움이랑 서운함이 같이 와서 더 어렵더라고요.", "가까운 사이라도 싫다고 한 건 한 번 들어줬으면 좋겠어요."] },
  { match: /병원|진료|아프|응급/, comments: ["아픈데 설명까지 혼자 챙겨야 하면 더 막막하죠.", "저도 병원 다녀오고 집에 오면 질문이 꼭 하나씩 생각납니다."] },
  { match: /폭염|폭우|날씨|재난/, comments: ["안전하게 하라는 말만 있고 쉴 수 있는 조건은 없을 때가 많죠.", "조금 늦어도 괜찮다는 분위기부터 생겼으면 좋겠어요."] },
];

function contextualComments(post: AutoCommentPost): [string, string] {
  const combined = `${post.title}\n${post.content}`;
  return TOPIC_COMMENTS.find((rule) => rule.match.test(combined))?.comments
    || CATEGORY_COMMENTS[post.category]
    || CATEGORY_COMMENTS.일상;
}

export async function generateAutoCommentBodies(post: AutoCommentPost) {
  return contextualComments(post);
}

export async function storeAutoComments(post: AutoCommentPost, bodies: string[]) {
  const sql = db();
  const existing = await sql`
    SELECT id FROM comments
    WHERE post_id = ${post.id} AND id LIKE 'jinju-auto-%'
    LIMIT 1`;
  if (existing[0]) return false;
  const schedule = autoCommentSchedule(post.createdAt);
  await Promise.all(bodies.map(async (body, index) => {
    const id = `jinju-auto-${post.id}-${index + 1}`;
    const createdAt = schedule[index];
    await sql`
      INSERT INTO comments (id, post_id, content, display_name, delete_key_hash, status, created_at)
      VALUES (${id}, ${post.id}, ${body}, ${nickname(post.id, index)}, ${await hash(`auto:${id}`)}, 'approved', ${createdAt})
      ON CONFLICT (id) DO NOTHING`;
  }));
  await sql`
    UPDATE posts
    SET comment_count = (
      SELECT COUNT(*)::INTEGER FROM comments
      WHERE post_id = ${post.id} AND status = 'approved' AND created_at <= NOW()
    ), updated_at = NOW()
    WHERE id = ${post.id}`;
  return true;
}

export async function ensureAutoComments(post: AutoCommentPost) {
  return storeAutoComments(post, await generateAutoCommentBodies(post));
}
