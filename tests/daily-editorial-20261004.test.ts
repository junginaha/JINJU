import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { october4Candidates as candidates, october4EditorialComments as commentsFor, october4EditorialPosts as posts, october4Research as research, october4Selection as selection } from "../lib/daily-editorial-20261004";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker, similarity } from "../lib/dedup";
import { refinedJinjuDisplayName } from "../lib/display-name";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20261004-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("10월 4일 후보 20개를 검토해 요구 분야의 서로 다른 9편을 고른다", () => {
  assert.equal(candidates.length, 20);
  assert.equal(posts.length, 9);
  assert.equal(new Set(selection.selected).size, 9);
  assert.deepEqual(posts.map(p => p.title), selection.selected.map(i => candidates[i][0]));
  assert.equal(selection.semanticReview.length, posts.length);
  candidates.forEach((c, i) => {
    if (!(selection.selected as readonly number[]).includes(i)) assert.match(c[2], /제외/u);
  });
  const count = (...cats: string[]) => posts.filter(p => cats.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
  assert.match(research.checkedAt, /^2026-10-04T/u);
  assert.ok(research.sources.some(s => s.includes("nasa.gov")));
  assert.ok(research.sources.some(s => s.includes("apnews.com")));
  assert.ok(research.sources.some(s => s.includes("ykkfastening.com")));
});

test("10월 4일 문장·제목·안전성·반응 범위를 검사한다", () => {
  const anchors = [/우주.*식물|식물.*우주/u, /지퍼.*안감|안감.*지퍼/u, /조리법.*불리기/u, /식당.*취향/u, /양파.*같이/u, /계란.*껍데기/u, /공연.*안내원/u, /북클럽.*각자/u, /작년.*메모/u];
  assert.deepEqual(editorialDiversityIssues(posts, commentsFor), []);
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
  assert.match(posts[0].content, /실험을 한다니/u);
  assert.doesNotMatch(posts[0].content, /재배에 성공|우주선 바깥|실험 결과/u);
  assert.match(posts[1].content, /천천히 되돌/u);
  assert.match(posts[5].content, /다시 쓰지 않고/u);
});

test("10월 4일 이름 102개가 두 단어·고유 이름이며 공개 이름 보정으로 바뀌지 않는다", () => {
  const oldNames = new Set(old.flatMap(p => [String(p.displayName), ...builtInComments(p.id).map(c => c.displayName)]));
  const entries = [...posts.map(p => ({ id: p.id, displayName: String(p.displayName) })), ...comments];
  assert.equal(entries.length, 102);
  assert.equal(new Set(entries.map(e => e.displayName)).size, entries.length);
  for (const e of entries) {
    assert.equal(e.displayName.trim().split(/\s+/u).length, 2, e.displayName);
    assert.equal(oldNames.has(e.displayName), false, e.displayName);
    assert.equal(refinedJinjuDisplayName(e.displayName, e.id), e.displayName);
  }
});

test("10월 4일 불규칙 게시·첫 댓글 3개·다음 날 댓글·경계 시각 공개 수를 확인한다", () => {
  const times = posts.map(p => Date.parse(p.createdAt));
  const gaps = times.slice(1).map((t, i) => t - times[i]);
  assert.ok(gaps.every(n => n > 0));
  assert.ok(new Set(gaps).size >= 6);
  assert.equal(comments.length, 93);
  assert.equal(new Set(posts.map(p => commentsFor(p.id).length)).size, 4);
  for (const p of posts) {
    assert.match(p.createdAt, /^2026-10-04T/u);
    const minute = +p.createdAt.slice(11, 13) * 60 + +p.createdAt.slice(14, 16);
    assert.ok(minute >= 420 && minute <= 1350);
    const cs = commentsFor(p.id);
    assert.ok(cs.length >= 9 && cs.length <= 12);
    assert.equal(normalizeCommentTimes(p.createdAt, cs, Date.parse(p.createdAt)).length, 0);
    cs.forEach((c, i) => {
      const t = Date.parse(c.createdAt);
      const delay = (t - Date.parse(p.createdAt)) / 60000;
      assert.ok(delay > 0);
      if (i < 3) assert.ok(delay >= 3 && delay <= 18);
      if (i >= 3) assert.ok(delay >= 30);
      assert.equal(normalizeCommentTimes(p.createdAt, cs, t - 1).length, i);
      assert.equal(normalizeCommentTimes(p.createdAt, cs, t).length, i + 1);
    });
  }
  assert.ok(comments.some(c => Date.parse(c.createdAt) >= Date.parse("2026-10-05T00:00:00+09:00")));
});

test("10월 4일 피드 연결은 중복 없이 새 글·댓글만 추가하며 편집 메모를 공개하지 않는다", () => {
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
