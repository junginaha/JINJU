import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { september8Candidates, september8EditorialComments as commentsFor, september8EditorialPosts as posts, september8Research, september8Selection } from "../lib/daily-editorial-20260908";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20260908-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("9월 8일 후보 20개에서 분야별 최소 비중을 갖춘 9편을 고른다", () => {
  assert.equal(september8Candidates.length, 20);
  assert.equal(posts.length, 9);
  assert.equal(september8Selection.selected.length, 9);
  assert.equal(september8Selection.exclusions.length, 11);
  assert.equal(september8Selection.semanticReview.length, 9);
  assert.ok(september8Research.sources.some(s => s.includes("unesco.org")));
  const count = (...categories: string[]) => posts.filter(p => categories.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 8일 본문은 2~4문장이며 제목과 같은 장면을 가리킨다", () => {
  const anchors = [/문해|공지|안내문/u, /소파|복도/u, /서류|스캔/u, /도예|접시|그릇/u, /친구|발표|원래/u, /보드게임|규칙/u, /사진|어깨/u, /악보|친구/u, /시|읽/u];
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
  const text = posts.map(p => p.title + p.content).join("\n") + comments.map(c => c.body).join("\n");
  assert.doesNotMatch(text, /\.\.\.|…|까요\?|듣러|이 날을|https?:\/\/|AI가|인공지능이|010[- ]?\d{4}|[\w.+-]+@[\w.-]+\.[a-z]{2,}/u);
  assert.match(posts[0].content, /9월 8일.*60년/u);
  assert.match(posts[0].content, /현지 8~9일.*예정/u);
});

test("9월 8일 작성자명은 전체 기존 데이터와 겹치지 않는 두 단어다", () => {
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

test("9월 8일 댓글 94개는 게시 후 순차 공개되고 미래 댓글은 집계하지 않는다", () => {
  assert.deepEqual(posts.map(p => commentsFor(p.id).length), [10, 11, 9, 12, 10, 11, 9, 12, 10]);
  assert.equal(comments.length, 94);
  const times = posts.map(p => Date.parse(p.createdAt));
  assert.equal(new Set(times.slice(1).map((t, i) => t - times[i])).size, posts.length - 1);
  posts.forEach(p => {
    assert.match(p.createdAt, /^2026-09-08T/u);
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
  assert.ok(comments.some(c => c.createdAt >= "2026-09-08T15:00:00.000Z"));
});

test("9월 8일 콘텐츠는 기존 중복 탐지를 통과하고 댓글까지 피드에 연결된다", () => {
  const duplicate = createDuplicatePostChecker();
  for (const p of posts) {
    assert.ok(!old.some(o => duplicate(p, o)), p.title);
    assert.ok(builtInPosts.some(o => o.id === p.id));
    assert.deepEqual(builtInComments(p.id), commentsFor(p.id));
    assert.equal(p.commentCount, commentsFor(p.id).length);
  }
});
