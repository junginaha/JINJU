import type { EditorialPost } from './editorial';

export type TodaysPearl = { day: string; id: string; title: string; excerpt: string; reason: string };
const KST = 9 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const editorialPicks: Record<string, { id: string; reason: string }> = {
  '2026-10-23': {
    id: 'jinju-editorial-20261023-starry-night-sky',
    reason: '익숙한 명화에 새로운 질문이 생겼어요. 여러분의 시선도 들려주세요.',
  },
};
export function koreaDay(now: number) { return new Date(now + KST).toISOString().slice(0, 10); }
export function nextKoreaDay(now: number) { return Date.parse(koreaDay(now) + 'T00:00:00+09:00') + DAY; }
function dailyVariation(id: string, cutoff: number) {
  let hash=2166136261;
  for(const char of koreaDay(cutoff)+id) { hash=Math.imul(hash ^ char.charCodeAt(0),16777619); }
  hash=Math.imul(hash ^ (hash >>> 16),2246822507);
  return (hash >>> 0)/4294967296 * 2;
}
function score(post: EditorialPost, cutoff: number) {
  const age = (cutoff - Date.parse(post.createdAt)) / DAY;
  const text = post.title + ' ' + post.content;
  const topical = /뉴스|연구|발표|정책|공개|물가|출퇴근|직장|관계/.test(text) ? 4 : 0;
  const discussion = /[?？]|여러분|어떻게|어디까지|어느 쪽|괜찮|서운|선택/.test(text) ? 3 : 0;
  return Math.max(0, 14 - age) + topical + discussion + dailyVariation(post.id,cutoff);
}
/** One daily editorial slot. Reactions never influence selection; input data is never changed. */
export function selectTodaysPearl(posts: readonly EditorialPost[], now = Date.now()): TodaysPearl | null {
  const day = koreaDay(now);
  const start = Date.parse(day + 'T00:00:00+09:00');
  const available = posts.filter(p => p.title.trim() && p.content.trim().length >= 60 && Date.parse(p.createdAt) <= now);
  const chosen = new Set<string>();
  let result: EditorialPost | undefined;
  // Reconstruct recent choices deterministically so a refresh or a new reaction cannot change today's pick.
  for (let offset = 6; offset >= 0; offset--) {
    const cutoff = start - offset * DAY;
    const date = koreaDay(cutoff);
    const curated = editorialPicks[date];
    const fixed = curated && available.find(p => p.id === curated.id && Date.parse(p.createdAt) <= (offset === 0 ? now : cutoff + DAY - 1));
    // Midnight cutoff makes automatic picks stable even when new articles arrive during the day.
    const candidates = available.filter(p => Date.parse(p.createdAt) < cutoff && !chosen.has(p.id));
    const recent = candidates.filter(p => Date.parse(p.createdAt) >= cutoff - 14 * DAY);
    const pool = recent.length ? recent : candidates;
    pool.sort((a,b) => score(b,cutoff) - score(a,cutoff) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
    result = fixed || pool[0];
    if (result) chosen.add(result.id);
  }
  if (!result) return null;
  return {
    day, id: result.id, title: result.title,
    excerpt: result.content.replace(/\s+/g, ' ').trim().slice(0, 120),
    reason: editorialPicks[day]?.id === result.id ? editorialPicks[day].reason : '다른 생각이 만나면 더 재미있어질 이야기, 오늘 함께 나눠요.',
  };
}
