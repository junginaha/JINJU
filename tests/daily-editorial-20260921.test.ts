import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september21Candidates,
  september21EditorialComments as commentsFor,
  september21EditorialPosts as posts,
  september21Research,
  september21Selection,
} from "../lib/daily-editorial-20260921";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260921-"));
const comments = posts.flatMap((post) => commentsFor(post.id));

test("9월 21일 후보 20개에서 중복 구조를 제외하고 분야별 9편을 선정한다", () => {
  assert.equal(september21Candidates.length, 20);
  assert.equal(posts.length, 9);
  assert.equal(new Set(september21Selection.selected).size, posts.length);
  assert.deepEqual(posts.map((post) => post.title), september21Selection.selected.map((index) => september21Candidates[index][0]));
  for (const rejected of [1, 3, 5, 7, 9, 11, 13, 14, 15, 17, 19]) {
    assert.ok(!new Set<number>(september21Selection.selected).has(rejected));
  }
  assert.equal(september21Selection.semanticReview.length, posts.length);
  assert.equal(september21Research.baseCommit, "0eb4b5e9db28761ecda5fd09003ee3d0590bd836");
  assert.ok(september21Research.sources.some((source) => source.includes("alzint.org")));
  assert.ok(september21Research.sources.some((source) => source.includes("who.int")));
  const count = (...categories: string[]) => posts.filter((post) => categories.includes(post.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 21일 제목과 본문은 같은 장면을 담고 자연스러운 2~4문장으로 끝난다", () => {
  const anchors = [
    /(?=.*사진)(?=.*맞[히혀])/u,
    /(?=.*고무장갑)(?=.*안쪽)/u,
    /(?=.*수세미)(?=.*두)/u,
    /(?=.*휴대전화)(?=.*친구)/u,
    /(?=.*먹(?:고|는))(?=.*접시)/u,
    /(?=.*횡단보도)(?=.*귤)/u,
    /(?=.*42번)(?=.*테이블)/u,
    /(?=.*주인공)(?=.*동사)/u,
    /(?=.*소설)(?=.*창문)/u,
  ];
  posts.forEach((post, index) => {
    assert.match(post.title, anchors[index]);
    assert.match(post.content, anchors[index]);
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

test("9월 21일 당일 정보와 생활 조언은 사실 범위와 조건을 지킨다", () => {
  assert.match(posts[0].content, /9월 21일 세계 알츠하이머의 날/u);
  assert.doesNotMatch(posts[0].content, /진단|치료|예방|완치|초기 증상/u);
  assert.match(posts[0].content, /시험지가 아니라/u);
  assert.match(posts[1].content, /안쪽을 확인/u);
  assert.match(posts[2].content, /색이 다른 집게/u);
  assert.match(posts[3].content, /메모하는 중인지/u);
  assert.match(posts[4].content, /아직 먹는 중/u);
  assert.match(posts[5].content, /차도 방향을 막고/u);
  assert.match(posts[6].content, /메뉴 이름/u);
  assert.match(posts[7].content, /앞뒤 문장/u);
  assert.match(posts[8].content, /곧바로 화해의 상징이라고 정하진/u);
});

test("9월 21일 작성자명 102개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
  const oldNames = new Set(old.flatMap((post) => [String(post.displayName), ...builtInComments(post.id).map((comment) => comment.displayName)]));
  const names = [...posts.map((post) => String(post.displayName)), ...comments.map((comment) => comment.displayName)];
  assert.equal(names.length, 102);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.equal(name.trim().split(/\s+/u).length, 2, name);
    assert.ok(!oldNames.has(name), name);
  }
  const oldBodies = new Set(old.flatMap((post) => builtInComments(post.id).map((comment) => comment.body.trim())));
  assert.equal(new Set(comments.map((comment) => comment.body)).size, comments.length);
  assert.ok(comments.every((comment) => !oldBodies.has(comment.body.trim())));
});

test("9월 21일 댓글 93개는 글마다 9~12개이고 시간에 맞춰 차례로 공개된다", () => {
  assert.deepEqual(posts.map((post) => commentsFor(post.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9]);
  assert.equal(comments.length, 93);
  const postTimes = posts.map((post) => Date.parse(post.createdAt));
  assert.ok(postTimes.every((time, index) => index === 0 || time > postTimes[index - 1]));
  for (const post of posts) {
    assert.match(post.createdAt, /^2026-09-21T/u);
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
  assert.ok(comments.some((comment) => Date.parse(comment.createdAt) >= Date.parse("2026-09-22T00:00:00+09:00")));
});

test("글마다 최소 다섯 댓글이 해당 장면을 기발한 유머로 확장한다", () => {
  const playful = [
    [/구술시험/u, /정답표/u, /기억의 식탁/u, /사진 모서리/u, /점수 대신/u],
    [/호우주의보/u, /야근 표정/u, /오른손은 여름/u, /우산 없는 정류장/u, /작은 장마/u],
    [/사원증/u, /순환근무제/u, /조직 개편/u, /노동청/u, /업무분장/u],
    [/미래 일정으로 승진/u, /조기 폐막/u, /알리바이/u, /장편/u, /예매창/u],
    [/퇴근 준비/u, /면접/u, /관제탑/u, /수거반/u, /시계가 두 개/u],
    [/무단 횡단/u, /이적 시장/u, /임시 과일조합/u, /재경기/u, /상큼한 후일담/u],
    [/동창회/u, /기립 투표/u, /한 반/u, /본선 진출/u, /답이 42/u],
    [/야간 근무/u, /수하물/u, /동사 선거/u, /생활기록부/u, /책이 도넛/u],
    [/관리사무소/u, /상징 업무/u, /대사가 제법/u, /인테리어/u, /건축 허가/u],
  ];
  posts.forEach((post, index) => {
    const bodies = commentsFor(post.id).map((comment) => comment.body).join(" ");
    assert.ok(playful[index].every((pattern) => pattern.test(bodies)), post.id);
  });
});

test("9월 21일 피드 연결은 새 글과 공개 시점의 댓글만 더한다", () => {
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
