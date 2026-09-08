import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { september9Candidates, september9EditorialComments as commentsFor, september9EditorialPosts as posts, september9Research, september9Selection } from "../lib/daily-editorial-20260909";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20260909-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("9월 9일 후보 20개에서 분야별 최소 비중을 갖춘 9편을 고른다", () => {
  assert.equal(september9Candidates.length, 20);
  assert.equal(posts.length, 9);
  assert.equal(september9Selection.selected.length, 9);
  assert.equal(september9Selection.semanticReview.length, 9);
  assert.ok(september9Research.sources.some(s => s.includes("apple.com/apple-events")));
  assert.ok(september9Research.sources.some(s => s.includes("techradar.com")));
  const count = (...categories: string[]) => posts.filter(p => categories.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 9일 제목과 본문은 같은 장면이며 안전한 2~4문장으로 쓴다", () => {
  const anchors = [/발표|사양/u, /재료|팬/u, /드라이버/u, /초대장/u, /오늘|먼저/u, /퍼즐|상자/u, /노트/u, /셔틀콕|세 번/u, /사건|순서/u];
  posts.forEach((p, i) => {
    const sentences = p.content.match(/[^.!?]+[.!?]+/gu) ?? [];
    assert.ok(sentences.length >= 2 && sentences.length <= 4, p.id);
    assert.match(p.title, anchors[i]);
    assert.match(p.content, anchors[i]);
    assert.ok(p.heard >= 20 && p.heard <= 33);
    assert.equal(p.same, 0);
    assert.equal(p.support, 0);
    assert.equal(hasPii(p.title + p.content), false);
  });
  assert.deepEqual(editorialDiversityIssues(posts, commentsFor), []);
  const strings = [...posts.map(p => p.title + p.content), ...comments.map(c => c.body)];
  for (const text of strings) {
    assert.doesNotMatch(text, /\.\.\.|…|까요\?|https?:\/\/|AI가|인공지능이/u);
    assert.equal(reviewText(text).riskLevel, "low", text);
  }
  assert.match(posts[0].content, /미국 현지 9월 9일.*예고/u);
  assert.match(posts[0].content, /확인하지 못한/u);
  assert.doesNotMatch(posts[0].content, /발표했|출시했|아이폰 \d|폴더블|\d+만 원/u);
});

test("9월 9일 작성자명과 댓글은 기존 전체 시드와 중복되지 않는다", () => {
  const oldNames = new Set(old.flatMap(p => [String(p.displayName), ...builtInComments(p.id).map(c => c.displayName)]));
  const newNames = [...posts.map(p => String(p.displayName)), ...comments.map(c => c.displayName)];
  assert.equal(new Set(newNames).size, newNames.length);
  for (const name of newNames) {
    assert.equal(name.trim().split(/\s+/u).length, 2, name);
    assert.ok(!oldNames.has(name), name);
  }
  const oldBodies = new Set(old.flatMap(p => builtInComments(p.id).map(c => c.body.trim())));
  assert.equal(new Set(comments.map(c => c.body)).size, comments.length);
  assert.ok(comments.every(c => !oldBodies.has(c.body.trim())));
});

test("9월 9일 댓글 95개는 게시 시각 이후 순차 공개된다", () => {
  assert.deepEqual(posts.map(p => commentsFor(p.id).length), [9, 10, 11, 12, 9, 10, 12, 11, 11]);
  assert.equal(comments.length, 95);
  const times = posts.map(p => Date.parse(p.createdAt));
  assert.equal(new Set(times.slice(1).map((t, i) => t - times[i])).size, posts.length - 1);
  posts.forEach(p => {
    assert.match(p.createdAt, /^2026-09-09T/u);
    const minutes = Number(p.createdAt.slice(11, 13)) * 60 + Number(p.createdAt.slice(14, 16));
    assert.ok(minutes >= 420 && minutes <= 1350);
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
  assert.ok(comments.some(c => c.createdAt >= "2026-09-09T15:00:00.000Z"));
});

test("9월 9일 피드는 중복 없이 연결되고 미래 댓글을 미리 세지 않는다", () => {
  const duplicate = createDuplicatePostChecker();
  for (const p of posts) {
    assert.ok(!old.some(o => duplicate(p, o)), p.title);
    assert.ok(builtInPosts.some(o => o.id === p.id));
    assert.deepEqual(builtInComments(p.id), commentsFor(p.id));
    assert.equal(p.commentCount, commentsFor(p.id).length);
    assert.equal(normalizeCommentTimes(p.createdAt, commentsFor(p.id), Date.parse(p.createdAt)).length, 0);
  }
});
