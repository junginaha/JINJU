import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { september14Candidates, september14EditorialComments as commentsFor, september14EditorialPosts as posts, september14Research, september14Selection } from "../lib/daily-editorial-20260914";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20260914-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("9월 14일 후보 20개에서 중복 구조를 제외하고 분야별 10편을 선정한다", () => {
  assert.equal(september14Candidates.length, 20);
  assert.equal(posts.length, 10);
  assert.equal(new Set(september14Selection.selected).size, posts.length);
  assert.deepEqual(posts.map(p => p.title), september14Selection.selected.map(i => september14Candidates[i][0]));
  for (const rejected of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) assert.ok(!new Set<number>(september14Selection.selected).has(rejected));
  assert.equal(september14Selection.semanticReview.length, posts.length);
  assert.ok(september14Research.sources.some(s => s.includes("korea.kr/multi/visualNewsView")));
  assert.equal(september14Research.baseCommit, "f52ae8ee2e147c5692aef0064b907ee38f8c1008");
  const count = (...categories: string[]) => posts.filter(p => categories.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 14일 제목과 본문은 같은 장면을 담고 자연스러운 2~4문장으로 끝난다", () => {
  const anchors = [/(?=.*할인)(?=.*지역)/u, /(?=.*충전선)(?=.*종이띠)/u, /(?=.*냉동실)(?=.*이름표)/u, /(?=.*책)(?=.*이미)/u, /(?=.*농담)(?=.*웃)/u, /(?=.*자동문)(?=.*(?:입장|로딩))/u, /(?=.*의자)(?=.*코트)/u, /(?=.*원)(?=.*의자)/u, /(?=.*색인)(?=.*조연)/u, /(?=.*침묵)(?=.*(?:소리|말))/u];
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

test("9월 14일 당일 정보와 생활 조언은 조건과 주의점을 함께 둔다", () => {
  assert.match(posts[0].content, /오늘 일부 지역/u);
  assert.match(posts[0].content, /20%/u);
  assert.match(posts[0].content, /지역 16종/u);
  assert.match(posts[0].content, /10만원/u);
  assert.match(posts[0].content, /11월 30일/u);
  assert.doesNotMatch(posts[0].content, /누구나 구매|반드시 구매|재고 충분|전국 동시/u);
  assert.match(posts[1].content, /전원을 분리/u);
  assert.match(posts[1].content, /세게 꺾지 않고/u);
  assert.match(posts[2].content, /내용과 날짜/u);
  assert.match(posts[8].content, /본문/u);
  assert.match(posts[9].content, /앞뒤 문장/u);
});

test("9월 14일 작성자명 113개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
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

test("9월 14일 댓글 103개는 글마다 9~12개이고 시간에 맞춰 차례로 공개된다", () => {
  assert.deepEqual(posts.map(p => commentsFor(p.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9, 10]);
  assert.equal(comments.length, 103);
  const times = posts.map(p => Date.parse(p.createdAt));
  assert.equal(new Set(times.slice(1).map((t, i) => t - times[i])).size, posts.length - 1);
  for (const p of posts) {
    assert.match(p.createdAt, /^2026-09-14T/u);
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
  assert.ok(comments.some(c => Date.parse(c.createdAt) >= Date.parse("2026-09-15T00:00:00+09:00")));
});

test("9월 14일 피드 연결은 새 글과 공개 시점의 댓글만 더한다", () => {
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
