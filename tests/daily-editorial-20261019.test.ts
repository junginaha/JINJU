import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments as allBuiltInComments, builtInPosts } from "../lib/built-in-content";
// Operator-requested reader comments (2026-10-24) are checked in their own test.
const builtInComments = (id: string) => allBuiltInComments(id).filter((c) => !c.id.startsWith("reader-20261024-"));
import { october19Candidates as candidates, october19EditorialComments as commentsFor, october19EditorialPosts as posts, october19Research as research, october19Selection as selection } from "../lib/daily-editorial-20261019";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker, similarity } from "../lib/dedup";
import { refinedJinjuDisplayName } from "../lib/display-name";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20261019-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("10월19일 후보20개·선정9개·분야·내부 근거를 검사한다", () => {
  assert.equal(candidates.length, 20);
  assert.equal(posts.length, 9);
  assert.deepEqual(posts.map(p => p.title), selection.selected.map(i => candidates[i][0]));
  assert.equal(new Set(selection.selected).size, 9);
  candidates.forEach((c, i) => {
    if (!(selection.selected as readonly number[]).includes(i)) assert.match(c[2], /제외/u);
  });
  const count = (...cats: string[]) => posts.filter(p => cats.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
  assert.match(research.checkedAt, /^2026-10-19T/u);
  assert.ok(research.sources.some(s => s.includes("jpl.nasa.gov")));
  assert.ok(research.sources.some(s => s.includes("reuters.com")));
});

test("10월19일 제목본문·자연스러운 문장 범위·안전성·좋아요를 검사한다", () => {
  assert.deepEqual(editorialDiversityIssues(posts, commentsFor), []);
  const anchors = [/화성.*45킬로미터/u,/물병.*고무링/u,/압축파일.*작업 폴더/u,/멀어진.*표/u,/실수.*장소/u,/화분.*흙/u,/마우스.*손난로/u,/글자.*판·쇄/u,/소문.*들었/u];
  posts.forEach((p, i) => {
    assert.match(p.title + " " + p.content, anchors[i]);
    const sentences = p.content.match(/[^.!?]+[.!?]+/gu) ?? [];
    assert.ok(sentences.length >= 2 && sentences.length <= 4);
    assert.ok(p.heard >= 20 && p.heard <= 33);
    assert.equal(p.same, 0);
    assert.equal(p.support, 0);
    assert.doesNotMatch(p.content, /다\.(?:\s|$)/u);
  });
  for (const text of [...posts.map(p => `${p.title} ${p.content}`), ...comments.map(c => c.body)]) {
    assert.equal(hasPii(text), false, text);
    assert.equal(reviewText(text).riskLevel, "low", text);
    assert.doesNotMatch(text, /\.\.\.|…|까요\?|https?:\/\/|AI 작성|AI 생성|인공지능 작성/u);
  }
  assert.match(posts[0].content, /지난 10월 11일/u);
  assert.doesNotMatch(posts[0].content, /오늘.*기록을 세웠/u);
  assert.match(posts[8].content, /서로 다른 증거/u);
});

test("10월19일 작성자102명의 두 단어·기존 중복·표시 보정을 검사한다", () => {
  const names = new Set(old.flatMap(p => [String(p.displayName), ...builtInComments(p.id).map(c => c.displayName)]));
  const entries = [...posts.map(p => ({ id: p.id, displayName: String(p.displayName) })), ...comments];
  assert.equal(entries.length, 102);
  assert.equal(new Set(entries.map(e => e.displayName)).size, 102);
  for (const e of entries) {
    assert.equal(e.displayName.trim().split(/\s+/u).length, 2, e.displayName);
    assert.equal(names.has(e.displayName), false, e.displayName);
    assert.equal(refinedJinjuDisplayName(e.displayName, e.id), e.displayName);
  }
});

test("10월19일 게시 시각·댓글93개·시차와 현재 공개 배열의 경계를 검사한다", () => {
  const times = posts.map(p => Date.parse(p.createdAt));
  const gaps = times.slice(1).map((t, i) => t - times[i]);
  assert.ok(gaps.every(n => n > 0));
  assert.ok(new Set(gaps).size >= 6);
  assert.equal(comments.length, 93);
  assert.equal(new Set(posts.map(p => commentsFor(p.id).length)).size, 4);
  for (const p of posts) {
    assert.match(p.createdAt, /^2026-10-19T/u);
    const minute = +p.createdAt.slice(11, 13) * 60 + +p.createdAt.slice(14, 16);
    assert.ok(minute >= 420 && minute <= 1350);
    const cs = commentsFor(p.id);
    assert.ok(cs.length >= 9 && cs.length <= 12);
    assert.equal(normalizeCommentTimes(p.createdAt, cs, Date.parse(p.createdAt)).length, 0);
    cs.forEach((c, i) => {
      const t = Date.parse(c.createdAt), delay = (t - Date.parse(p.createdAt)) / 60000;
      assert.ok(delay > 0);
      if (i < 3) assert.ok(delay >= 3 && delay <= 18);
      else assert.ok(delay >= 30);
      assert.equal(normalizeCommentTimes(p.createdAt, cs, t - 1).length, i);
      assert.equal(normalizeCommentTimes(p.createdAt, cs, t).length, i + 1);
    });
  }
  assert.ok(comments.some(c => Date.parse(c.createdAt) >= Date.parse("2026-10-20T00:00:00+09:00")));
});

test("10월19일 피드 연결·중복·내부 메모 비노출을 검사한다", () => {
  const duplicate = createDuplicatePostChecker();
  for (const p of posts) {
    assert.equal(builtInPosts.filter(e => e.id === p.id).length, 1);
    assert.deepEqual(builtInComments(p.id), commentsFor(p.id));
    assert.equal(p.commentCount, commentsFor(p.id).length);
    assert.ok(!old.some(e => duplicate(p, e)), p.title);
    assert.ok(!old.some(e => similarity(p.content, e.content) > 0.5), p.title);
    assert.ok(!Object.keys(p).some(k => /Research|sources|evidence|Candidates|semanticReview/u.test(k)));
  }
});

