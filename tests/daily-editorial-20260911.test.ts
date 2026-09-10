import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { september11Candidates, september11EditorialComments as commentsFor, september11EditorialPosts as posts, september11Research, september11Selection } from "../lib/daily-editorial-20260911";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20260911-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("9월 11일 후보 22개에서 중복 소재를 제외하고 분야별 9편을 선정한다", () => {
  assert.equal(september11Candidates.length, 22);
  assert.equal(posts.length, 9);
  assert.equal(new Set(september11Selection.selected).size, 9);
  assert.deepEqual(posts.map(p => p.title), september11Selection.selected.map(i => september11Candidates[i][0]));
  for (const rejected of [4, 8, 9, 14, 15, 16, 17, 18, 19, 20]) assert.ok(!new Set<number>(september11Selection.selected).has(rejected));
  assert.equal(september11Selection.semanticReview.length, posts.length);
  assert.ok(september11Research.sources.some(s => s.includes("newsroom.ibm.com/2026-09-10")));
  assert.ok(september11Research.sources.some(s => s.includes("reuters.com/science/ibm-nasa")));
  const count = (...categories: string[]) => posts.filter(p => categories.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 11일 제목·본문 장면과 자연스러운 문장 형태·안전성을 검사한다", () => {
  const anchors = [/달/u, /(?=.*가격)(?=.*개)/u, /격주.*달력|격주와.*달력/u, /친구.*달래/u, /연휴/u, /앞치마/u, /(?=.*산책)(?=.*운동화)/u, /(?=.*영화)(?=.*장면)/u, /(?=.*첫 문장)(?=.*마지막 문장)/u];
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
  assert.match(posts[0].content, /미국 현지 9월 10일 발표/u);
  assert.match(posts[0].content, /새 얼음을 발견했다는 소식은 아니라서/u);
  assert.match(posts[4].content, /못 간다고 일찍 알리고/u);
  assert.match(posts[5].content, /조리는 안 했어도/u);
  assert.match(posts[6].content, /목줄을 챙겨 같이 나왔는데/u);
});

test("9월 11일 생활 정보의 계산과 적용 범위를 검증한다", () => {
  assert.equal(3300 / 3, 1100);
  assert.equal(4200 / 4, 1050);
  assert.match(posts[1].content, /같은 용량/u);
  assert.match(posts[1].content, /오늘 필요한 건 세 개/u);
  const dates = [2, 16, 30].map(d => Date.parse(`2026-10-${String(d).padStart(2, "0")}T12:00:00+09:00`));
  assert.equal(dates[1] - dates[0], 14 * 86400000);
  assert.equal(dates[2] - dates[1], 14 * 86400000);
  assert.ok(dates.every(d => new Date(d).getUTCDay() === 5));
  assert.match(posts[2].content, /휴강 안내/u);
  assert.match(posts[2].content, /수업 공지를 먼저/u);
});

test("9월 11일 작성자명 103개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
  const oldNames = new Set(old.flatMap(p => [String(p.displayName), ...builtInComments(p.id).map(c => c.displayName)]));
  const names = [...posts.map(p => String(p.displayName)), ...comments.map(c => c.displayName)];
  assert.equal(names.length, 103);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.equal(name.trim().split(/\s+/u).length, 2, name);
    assert.ok(!oldNames.has(name), name);
  }
  const oldBodies = new Set(old.flatMap(p => builtInComments(p.id).map(c => c.body.trim())));
  assert.equal(new Set(comments.map(c => c.body)).size, comments.length);
  assert.ok(comments.every(c => !oldBodies.has(c.body.trim())));
});

test("9월 11일 댓글 94개는 불규칙한 게시 시각 뒤에 공개되며 미래 댓글은 세지 않는다", () => {
  assert.deepEqual(posts.map(p => commentsFor(p.id).length), [10, 9, 12, 11, 10, 12, 9, 11, 10]);
  assert.equal(comments.length, 94);
  const times = posts.map(p => Date.parse(p.createdAt));
  assert.equal(new Set(times.slice(1).map((t, i) => t - times[i])).size, posts.length - 1);
  for (const p of posts) {
    assert.match(p.createdAt, /^2026-09-11T/u);
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
  assert.ok(comments.some(c => Date.parse(c.createdAt) >= Date.parse("2026-09-12T00:00:00+09:00")));
});

test("9월 11일 피드 연결은 중복 없이 새 글·댓글만 추가한다", () => {
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
