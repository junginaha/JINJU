import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { september12Candidates, september12EditorialComments as commentsFor, september12EditorialPosts as posts, september12Research, september12Selection } from "../lib/daily-editorial-20260912";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20260912-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("9월 12일 후보 21개에서 중복 소재를 제외하고 분야별 9편을 선정한다", () => {
  assert.equal(september12Candidates.length, 21);
  assert.equal(posts.length, 9);
  assert.equal(new Set(september12Selection.selected).size, 9);
  assert.deepEqual(posts.map(p => p.title), september12Selection.selected.map(i => september12Candidates[i][0]));
  for (const rejected of [3, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]) assert.ok(!new Set<number>(september12Selection.selected).has(rejected));
  assert.equal(september12Selection.semanticReview.length, posts.length);
  assert.ok(september12Research.sources.some(s => s.includes("usopen.org/en_US/news/articles/2026-09-11")));
  assert.ok(september12Research.sources.some(s => s.includes("reuters.com/sports/tennis")));
  const count = (...categories: string[]) => posts.filter(p => categories.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 12일 제목·본문 장면과 자연스러운 문장 형태·안전성을 검사한다", () => {
  const anchors = [/결승/u, /(?=.*자)(?=.*0)/u, /(?=.*손)(?=.*그림자)/u, /(?=.*친구)(?=.*글|.*원고)/u, /(?=.*부탁)(?=.*친구)/u, /(?=.*빵)(?=.*식탁)/u, /(?=.*왕관)(?=.*종이)/u, /(?=.*목차)(?=.*질문)/u, /(?=.*감사의 말)(?=.*책)/u];
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
  assert.match(posts[0].content, /미국 현지 9월 12일 열릴 예정/u);
  assert.match(posts[0].content, /표정만으로 마음을 다 안다고 할 수는 없지만/u);
  assert.match(posts[3].content, /어색한 부분만/u);
  assert.match(posts[4].content, /다른 부탁/u);
  assert.match(posts[5].content, /쟁반에 받아 치웠어요/u);
  assert.match(posts[6].content, /흘러내리지 않게/u);
});

test("9월 12일 생활 정보의 계산과 적용 범위를 검증한다", () => {
  assert.equal(12 - 2, 10);
  assert.match(posts[1].content, /0 눈금 앞에 작은 여백/u);
  assert.match(commentsFor(posts[1].id)[2].body, /시작값을 빼도/u);
  assert.match(posts[2].content, /손 반대편/u);
  assert.match(posts[2].content, /그 자리에서는/u);
  assert.match(posts[2].content, /빛이 눈에 직접 들어오지 않는/u);
  assert.match(posts[7].content, /이 책에서 다루지 않는/u);
  assert.match(posts[8].content, /저자가 직접 적은/u);
});

test("9월 12일 작성자명 102개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
  const oldNames = new Set(old.flatMap(p => [String(p.displayName), ...builtInComments(p.id).map(c => c.displayName)]));
  const names = [...posts.map(p => String(p.displayName)), ...comments.map(c => c.displayName)];
  assert.equal(names.length, 102);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.equal(name.trim().split(/\s+/u).length, 2, name);
    assert.ok(!oldNames.has(name), name);
  }
  const oldBodies = new Set(old.flatMap(p => builtInComments(p.id).map(c => c.body.trim())));
  assert.equal(new Set(comments.map(c => c.body)).size, comments.length);
  assert.ok(comments.every(c => !oldBodies.has(c.body.trim())));
});

test("9월 12일 댓글 93개는 불규칙한 게시 시각 뒤에 공개되며 미래 댓글은 세지 않는다", () => {
  assert.deepEqual(posts.map(p => commentsFor(p.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9]);
  assert.equal(comments.length, 93);
  const times = posts.map(p => Date.parse(p.createdAt));
  assert.equal(new Set(times.slice(1).map((t, i) => t - times[i])).size, posts.length - 1);
  for (const p of posts) {
    assert.match(p.createdAt, /^2026-09-12T/u);
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
  assert.ok(comments.some(c => Date.parse(c.createdAt) >= Date.parse("2026-09-13T00:00:00+09:00")));
});

test("9월 12일 피드 연결은 중복 없이 새 글·댓글만 추가한다", () => {
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
