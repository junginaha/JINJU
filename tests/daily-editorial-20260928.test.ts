import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september28Candidates,
  september28EditorialComments as commentsFor,
  september28EditorialPosts as posts,
  september28Research,
  september28Selection,
} from "../lib/daily-editorial-20260928";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260928-"));
const comments = posts.flatMap((post) => commentsFor(post.id));

test("9월 28일 후보 20개에서 반복 구조를 제외하고 분야별 10편을 선정한다", () => {
  assert.equal(september28Candidates.length, 20);
  assert.equal(posts.length, 10);
  assert.equal(new Set(september28Selection.selected).size, posts.length);
  assert.deepEqual(posts.map((post) => post.title), september28Selection.selected.map((index) => september28Candidates[index][0]));
  for (const rejected of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) {
    assert.ok(!new Set<number>(september28Selection.selected).has(rejected));
  }
  assert.equal(september28Selection.semanticReview.length, posts.length);
  assert.equal(september28Research.baseCommit, "cace6db12849db331ccc54c14b5bf3da63281465");
  assert.ok(september28Research.sources.some((source) => source.includes("who.int")));
  assert.ok(september28Research.sources.some((source) => source.includes("rabiesalliance.org")));
  const count = (...categories: string[]) => posts.filter((post) => categories.includes(post.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 28일 제목과 본문은 같은 장면을 담고 자연스러운 2~4문장으로 끝난다", () => {
  const anchors = [
    /(?=.*반려견)(?=.*접종일)/u,
    /(?=.*현관 바구니)(?=.*반품)/u,
    /(?=.*보증서)(?=.*제품과 날짜)/u,
    /(?=.*사과)(?=.*의도)/u,
    /(?=.*듣기)(?=.*해결)(?=.*어느 쪽)/u,
    /(?=.*젖은 바닥)(?=.*빈 상자)/u,
    /(?=.*공용 식탁)(?=.*한 칸)/u,
    /(?=.*냉동만두)(?=.*컬링)/u,
    /(?=.*결정 직전)(?=.*책을 덮)(?=.*다면)/u,
    /(?=.*서문)(?=.*결말)/u,
  ];
  posts.forEach((post, index) => {
    assert.match(`${post.title} ${post.content}`, anchors[index]);
    const sentences = post.content.match(/[^.!?]+[.!?]+/gu) ?? [];
    assert.ok(sentences.length >= 2 && sentences.length <= 4, post.id);
    assert.ok(post.heard >= 20 && post.heard <= 33);
    assert.equal(post.same, 0);
    assert.equal(post.support, 0);
  });
  assert.deepEqual(editorialDiversityIssues(posts, commentsFor), []);
  for (const text of [...posts.map((post) => `${post.title} ${post.content}`), ...comments.map((comment) => comment.body)]) {
    assert.equal(hasPii(text), false, text);
    assert.equal(reviewText(text).riskLevel, "low", text);
    assert.doesNotMatch(text, /\.\.\.|…|까요\?|https?:\/\/|AI 작성|AI 생성|인공지능 작성/u);
  }
});

test("9월 28일 당일 정보와 실생활 조언은 확인된 범위와 조건을 지킨다", () => {
  assert.match(posts[0].content, /세계 광견병의 날/u);
  assert.match(posts[0].content, /동물병원에 물어/u);
  assert.doesNotMatch(posts[0].content, /광견병이 없다|완벽히 예방|무조건 안전/u);
  assert.match(posts[1].content, /달력에 적/u);
  assert.match(posts[2].content, /제품과 날짜/u);
  assert.match(posts[3].content, /말을 끊어/u);
  assert.match(posts[4].content, /그냥 들어주길 원하는지/u);
  assert.match(posts[5].content, /주소나 이름은 들여다보지 않고/u);
  assert.match(posts[6].content, /옆 의자와 바닥/u);
  assert.match(posts[7].content, /집게로 집어 버린 뒤/u);
  assert.match(posts[8].content, /앞선 장면/u);
  assert.match(posts[9].content, /끝내 남은 빈칸/u);
});

test("9월 28일 작성자명 113개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
  const oldNames = new Set(old.flatMap((post) => [String(post.displayName), ...builtInComments(post.id).map((comment) => comment.displayName)]));
  const names = [...posts.map((post) => String(post.displayName)), ...comments.map((comment) => comment.displayName)];
  assert.equal(names.length, 113);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.equal(name.trim().split(/\s+/u).length, 2, name);
    assert.ok(!oldNames.has(name), name);
  }
  const oldBodies = new Set(old.flatMap((post) => builtInComments(post.id).map((comment) => comment.body.trim())));
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);
  assert.ok(comments.every((comment) => !oldBodies.has(comment.body.trim())));
});

test("9월 28일 댓글 103개는 글마다 9~12개이고 시간에 맞춰 차례로 공개된다", () => {
  assert.deepEqual(posts.map((post) => commentsFor(post.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9, 10]);
  assert.equal(comments.length, 103);
  const postTimes = posts.map((post) => Date.parse(post.createdAt));
  assert.ok(postTimes.every((time, index) => index === 0 || time > postTimes[index - 1]));
  for (const post of posts) {
    assert.match(post.createdAt, /^2026-09-28T/u);
    const minute = Number(post.createdAt.slice(11, 13)) * 60 + Number(post.createdAt.slice(14, 16));
    assert.ok(minute >= 420 && minute <= 1350);
    const postComments = commentsFor(post.id);
    postComments.forEach((comment, index) => {
      const delay = (Date.parse(comment.createdAt) - Date.parse(post.createdAt)) / 60000;
      assert.ok(delay > 0);
      if (index < 3) assert.ok(delay >= 3 && delay <= 18);
      if (index) assert.ok(Date.parse(comment.createdAt) > Date.parse(postComments[index - 1].createdAt));
      const time = Date.parse(comment.createdAt);
      assert.equal(normalizeCommentTimes(post.createdAt, postComments, time - 1).length, index);
      assert.equal(normalizeCommentTimes(post.createdAt, postComments, time).length, index + 1);
    });
  }
  assert.ok(comments.some((comment) => Date.parse(comment.createdAt) >= Date.parse("2026-09-29T00:00:00+09:00")));
});

test("글마다 최소 네 댓글이 해당 장면을 기발한 유머로 확장한다", () => {
  const playful = [
    [/겨울잠/u, /전근 발령/u, /의전 서열/u, /집안의 진짜/u],
    [/출고 부서/u, /현관 터미널/u, /여행 준비/u, /알림판/u],
    [/고고학/u, /혈압을 끓/u, /손을 들/u, /족보/u],
    [/변론 개시/u, /퇴장시키/u, /변호사는 휴무/u, /영향 기록관/u],
    [/현관에서 신발/u, /주문하지 않은 택배/u, /목 근육/u, /표지판/u],
    [/마른 섬/u, /등대/u, /감사했/u, /구조대장/u],
    [/범인은 끝까지 투명/u, /휴지는 오늘/u, /조기 퇴근/u, /컵은 넘어졌지만/u],
    [/브러시는 없고/u, /선방/u, /선수단/u, /체육연금/u],
    [/화면 정지/u, /다음 장을/u, /용의자/u, /자신 있게 틀릴/u],
    [/약속어음/u, /내부 감사/u, /번호표/u, /답변 창구/u],
  ];
  posts.forEach((post, index) => {
    const bodies = commentsFor(post.id).map((comment) => comment.body).join(" ");
    assert.ok(playful[index].every((pattern) => pattern.test(bodies)), post.id);
  });
});

test("9월 28일 피드 연결은 새 글과 공개 시점의 댓글만 더한다", () => {
  const duplicate = createDuplicatePostChecker();
  for (const post of posts) {
    assert.ok(!old.some((existing) => duplicate(post, existing)), post.title);
    assert.equal(builtInPosts.filter((existing) => existing.id === post.id).length, 1);
    assert.deepEqual(builtInComments(post.id), commentsFor(post.id));
    assert.equal(post.commentCount, commentsFor(post.id).length);
    assert.equal(normalizeCommentTimes(post.createdAt, commentsFor(post.id), Date.parse(post.createdAt)).length, 0);
    assert.ok(!Object.keys(post).some((key) => /Research|sources|evidence|Candidates|semanticReview/u.test(key)));
  }
});
