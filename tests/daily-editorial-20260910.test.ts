import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { september10Candidates, september10EditorialComments as commentsFor, september10EditorialPosts as posts, september10Research, september10Selection } from "../lib/daily-editorial-20260910";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20260910-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("9월 10일 후보 22개에서 분야별 비중을 갖춘 9편을 선정한다", () => {
  assert.equal(september10Candidates.length, 22);
  assert.equal(posts.length, 9);
  assert.equal(new Set(september10Selection.selected).size, 9);
  assert.deepEqual(posts.map(p => p.title), september10Selection.selected.map(i => september10Candidates[i][0]));
  assert.ok(!new Set<number>(september10Selection.selected).has(5));
  assert.equal(september10Selection.semanticReview.length, 9);
  assert.ok(september10Research.sources.some(s => s.includes("nasa-names-two-artemis")));
  assert.ok(september10Research.sources.some(s => s.includes("apnews.com")));
  const count = (...categories: string[]) => posts.filter(p => categories.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 10일 제목·본문의 장면과 안전성·다양성을 검증한다", () => {
  const anchors = [/경험/u, /파일.*형식/u, /계량스푼/u, /(?=.*이야기)(?=.*결말)/u, /수업/u, /토스트|테두리/u, /헤드폰/u, /영화.*소리/u, /본문.*각주/u];
  posts.forEach((p, i) => {
    const sentences = p.content.match(/[^.!?]+[.!?]+/gu) ?? [];
    assert.ok(sentences.length >= 2 && sentences.length <= 4, p.id);
    assert.match(p.title, anchors[i]);
    assert.match(p.content, anchors[i]);
    assert.ok(p.heard >= 20 && p.heard <= 33);
    assert.equal(p.same, 0);
    assert.equal(p.support, 0);
  });
  assert.deepEqual(editorialDiversityIssues(posts, commentsFor), []);
  for (const value of [...posts.map(p => p.title + p.content), ...comments.map(c => c.body)]) {
    assert.equal(hasPii(value), false, value);
    assert.doesNotMatch(value, /\.\.\.|…|까요\?|https?:\/\/|AI가|인공지능이/u);
    assert.equal(reviewText(value).riskLevel, "low", value);
  }
  assert.match(posts[0].content, /미국 현지 9월 9일.*발표/u);
  assert.match(posts[0].content, /교육과 멘토링/u);
  assert.doesNotMatch(posts[0].content, /퇴임 이유|달에 착륙|재취업 실패/u);
  assert.match(posts[1].content, /원본을 남겨두고/u);
  assert.match(posts[5].content, /먹기 전에/u);
});

test("9월 10일 모든 작성자명은 정확히 두 단어이며 전체 시드와 중복되지 않는다", () => {
  const oldNames = new Set(old.flatMap(p => [String(p.displayName), ...builtInComments(p.id).map(c => c.displayName)]));
  const names = [...posts.map(p => String(p.displayName)), ...comments.map(c => c.displayName)];
  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.equal(name.trim().split(/\s+/u).length, 2, name);
    assert.ok(!oldNames.has(name), name);
  }
  const oldBodies = new Set(old.flatMap(p => builtInComments(p.id).map(c => c.body.trim())));
  assert.equal(new Set(comments.map(c => c.body)).size, comments.length);
  assert.ok(comments.every(c => !oldBodies.has(c.body.trim())));
});

test("9월 10일 댓글 95개는 불규칙한 게시 시각 뒤에 순차 공개된다", () => {
  assert.deepEqual(posts.map(p => commentsFor(p.id).length), [9, 10, 11, 12, 9, 10, 12, 11, 11]);
  assert.equal(comments.length, 95);
  const times = posts.map(p => Date.parse(p.createdAt));
  assert.equal(new Set(times.slice(1).map((t, i) => t - times[i])).size, posts.length - 1);
  posts.forEach(p => {
    assert.match(p.createdAt, /^2026-09-10T/u);
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
  });
  assert.ok(comments.some(c => c.createdAt >= "2026-09-10T15:00:00.000Z"));
});

test("9월 10일 피드 연결은 중복 없이 현재 공개된 댓글만 반환한다", () => {
  const duplicate = createDuplicatePostChecker();
  for (const p of posts) {
    assert.ok(!old.some(o => duplicate(p, o)), p.title);
    assert.ok(builtInPosts.some(o => o.id === p.id));
    assert.deepEqual(builtInComments(p.id), commentsFor(p.id));
    assert.equal(p.commentCount, commentsFor(p.id).length);
    assert.equal(normalizeCommentTimes(p.createdAt, commentsFor(p.id), Date.parse(p.createdAt)).length, 0);
  }
});
