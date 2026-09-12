import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { september13Candidates, september13EditorialComments as commentsFor, september13EditorialPosts as posts, september13Research, september13Selection } from "../lib/daily-editorial-20260913";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20260913-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("9월 13일 후보 20개에서 중복 구조를 제외하고 분야별 10편을 선정한다", () => {
  assert.equal(september13Candidates.length, 20);
  assert.equal(posts.length, 10);
  assert.equal(new Set(september13Selection.selected).size, posts.length);
  assert.deepEqual(posts.map(p => p.title), september13Selection.selected.map(i => september13Candidates[i][0]));
  for (const rejected of [2, 4, 6, 8, 10, 12, 14, 16, 18, 19]) assert.ok(!new Set<number>(september13Selection.selected).has(rejected));
  assert.equal(september13Selection.semanticReview.length, posts.length);
  assert.ok(september13Research.sources.some(s => s.includes("ifrc.org/article/world-first-aid-day-2026")));
  assert.ok(september13Research.sources.some(s => s.includes("redcross.ca")));
  const count = (...categories: string[]) => posts.filter(p => categories.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 13일 제목과 본문은 같은 장면을 담고 자연스러운 2~4문장으로 끝난다", () => {
  const anchors = [/(?=.*구급함)(?=.*날짜)/u, /(?=.*테이프)(?=.*끝)/u, /(?=.*가방)(?=.*주머니)/u, /(?=.*약속)(?=.*날짜)/u, /(?=.*칭찬)(?=.*비교)/u, /(?=.*국수)(?=.*셔츠)/u, /(?=.*비누)(?=.*세면대)/u, /(?=.*이름표)(?=.*손짓)/u, /(?=.*우리)(?=.*동그라미)/u, /(?=.*부탁)(?=.*주인공)/u];
  posts.forEach((p, i) => {
    assert.match(p.title, anchors[i]);
    assert.match(p.content, anchors[i]);
    const sentences = p.content.match(/[^.!?]+[.!?]+/gu) ?? [];
    assert.ok(sentences.length >= 2 && sentences.length <= 4, p.id);
    assert.ok(p.heard >= 20 && p.heard <= 33);
    assert.equal(p.same, 0); assert.equal(p.support, 0);
  });
  assert.deepEqual(editorialDiversityIssues(posts, commentsFor), []);
  for (const text of [...posts.map(p => p.title + " " + p.content), ...comments.map(c => c.body)]) {
    assert.equal(hasPii(text), false, text);
    assert.equal(reviewText(text).riskLevel, "low", text);
    assert.doesNotMatch(text, /\.\.\.|…|까요\?|https?:\/\/|AI 작성|AI 생성|인공지능 작성/u);
  }
});

test("9월 13일 당일 정보와 생활 조언은 범위와 주의점을 함께 둔다", () => {
  assert.match(posts[0].content, /9월 둘째 토요일/u);
  assert.match(posts[0].content, /표시 내용/u);
  assert.match(posts[0].content, /공식 교육/u);
  assert.doesNotMatch(posts[0].content, /복용|투약|압박|소독|응급실로/u);
  assert.match(posts[1].content, /색종이/u);
  assert.match(posts[2].content, /늘 같은 안쪽 칸/u);
  assert.match(posts[5].content, /세탁 표시/u);
  assert.match(posts[6].content, /물이 빠지는 홈/u);
  assert.match(posts[8].content, /분명하지 않은/u);
  assert.match(posts[9].content, /본문에서/u);
});

test("9월 13일 작성자명 113개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
  const oldNames = new Set(old.flatMap(p => [String(p.displayName), ...builtInComments(p.id).map(c => c.displayName)]));
  const names = [...posts.map(p => String(p.displayName)), ...comments.map(c => c.displayName)];
  assert.equal(names.length, 113);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.equal(name.trim().split(/\s+/u).length, 2, name);
    assert.ok(!oldNames.has(name), name);
  }
  const oldBodies = new Set(old.flatMap(p => builtInComments(p.id).map(c => c.body.trim())));
  assert.equal(new Set(comments.map(c => c.body)).size, comments.length);
  assert.ok(comments.every(c => !oldBodies.has(c.body.trim())));
});

test("9월 13일 댓글 103개는 글마다 9~12개이고 시간에 맞춰 차례로 공개된다", () => {
  assert.deepEqual(posts.map(p => commentsFor(p.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9, 10]);
  assert.equal(comments.length, 103);
  const times = posts.map(p => Date.parse(p.createdAt));
  assert.equal(new Set(times.slice(1).map((t, i) => t - times[i])).size, posts.length - 1);
  for (const p of posts) {
    assert.match(p.createdAt, /^2026-09-13T/u);
    const minute = Number(p.createdAt.slice(11, 13)) * 60 + Number(p.createdAt.slice(14, 16));
    assert.ok(minute >= 420 && minute <= 1350);
    const cs = commentsFor(p.id);
    cs.forEach((c, i) => {
      const delay = (Date.parse(c.createdAt) - Date.parse(p.createdAt)) / 60000;
      assert.ok(delay > 0);
      if (i < 3) assert.ok(delay >= 3 && delay <= 18);
      if (i) assert.ok(Date.parse(c.createdAt) > Date.parse(cs[i - 1].createdAt));
      const t = Date.parse(c.createdAt);
      assert.equal(normalizeCommentTimes(p.createdAt, cs, t - 1).length, i);
      assert.equal(normalizeCommentTimes(p.createdAt, cs, t).length, i + 1);
    });
  }
  assert.ok(comments.some(c => Date.parse(c.createdAt) >= Date.parse("2026-09-14T00:00:00+09:00")));
});

test("9월 13일 피드 연결은 새 글과 공개 시점의 댓글만 더한다", () => {
  const duplicate = createDuplicatePostChecker();
  for (const p of posts) {
    assert.ok(!old.some(o => duplicate(p, o)), p.title);
    assert.equal(builtInPosts.filter(o => o.id === p.id).length, 1);
    assert.deepEqual(builtInComments(p.id), commentsFor(p.id));
    assert.equal(p.commentCount, commentsFor(p.id).length);
    assert.equal(normalizeCommentTimes(p.createdAt, commentsFor(p.id), Date.parse(p.createdAt)).length, 0);
    assert.ok(!Object.keys(p).some(k => /Research|sources|evidence|Candidates|semanticReview/u.test(k)));
  }
});
