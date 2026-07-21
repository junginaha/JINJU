import { db, hash } from "./db";

export type AutoCommentPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
};

const COMMENT_OFFSETS_MS = [
  3 * 60_000,
  9 * 60_000,
  21 * 60_000,
  47 * 60_000,
  5 * 60 * 60_000 + 11 * 60_000,
  24 * 60 * 60_000 + 8 * 60_000,
  25 * 60 * 60_000 + 19 * 60_000,
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

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sentences(content: string) {
  const parts = content
    .split(/(?<=[.!?。！？])\s+|\n+/)
    .map(compact)
    .filter((value) => value.length >= 4);
  return parts.length ? parts : [compact(content)];
}

function excerpt(value: string, maximum = 42) {
  const cleaned = compact(value).replace(/[“”\"]/g, "");
  return cleaned.length <= maximum ? cleaned : `${cleaned.slice(0, maximum).trim()}…`;
}

function contextualComments(post: AutoCommentPost) {
  const details = sentences(post.content);
  const title = excerpt(post.title, 46);
  const detail = (index: number) => excerpt(details[index % details.length] || post.title, 46);
  const asksQuestion = /[?？]|어떻게|어느 쪽|여러분|까요|인가요|할까요/.test(`${post.title} ${post.content}`);
  const sensitive = /자살|자해|죽|사망|장례|폭력|성폭력|범죄|피해|상실|응급|병원|아프|괴롭힘/.test(`${post.title} ${post.content}`);
  return [
    `“${title}”라는 제목부터 무슨 마음인지 바로 전해졌어요. 이 이야기를 꺼내주셔서 고맙습니다.`,
    `저는 “${detail(0)}”라는 대목에서 멈췄어요. 같은 상황이라면 저도 마음이 오래 남았을 것 같아요.`,
    sensitive
      ? `“${detail(1)}”이라는 말을 가볍게 넘길 수가 없네요. 혼자 감당해온 시간이 느껴집니다.`
      : `“${detail(1)}”에서 살짝 웃었는데, 웃고 나니 마음이 좀 남네요. 정말 사람 사는 장면 같아요.`,
    asksQuestion
      ? `글에서 던진 질문, 쉽게 한쪽 답만 고르기 어렵네요. 저는 “${detail(2)}”를 기준으로 조금 더 생각해보겠습니다.`
      : `“${detail(2)}”라는 말이 이 글의 중심처럼 느껴졌습니다. 그 마음을 이해하게 되네요.`,
    `처음에는 제목이 눈에 들어왔는데 다시 읽으니 “${detail(3)}”가 오래 남습니다. 다른 각도에서도 생각하게 됐어요.`,
    `하루 지나 다시 읽어도 “${detail(0)}”라는 문장이 마음에 남네요. 어제보다 뜻이 더 또렷하게 보입니다.`,
    `마지막으로 “${detail(1)}”를 한 번 더 읽고 갑니다. 이 이야기를 문장으로 꺼내준 덕분에 저도 생각이 깊어졌어요.`,
  ];
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
