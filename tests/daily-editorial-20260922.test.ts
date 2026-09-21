import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september22Candidates,
  september22EditorialComments as commentsFor,
  september22EditorialPosts as posts,
  september22Research,
  september22Selection,
} from "../lib/daily-editorial-20260922";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260922-"));
const comments = posts.flatMap((post) => commentsFor(post.id));

test("9월 22일 후보 20개에서 반복 구조를 제외하고 분야별 10편을 선정한다", () => {
  assert.equal(september22Candidates.length, 20);
  assert.equal(posts.length, 10);
  assert.equal(new Set(september22Selection.selected).size, posts.length);
  assert.deepEqual(posts.map((post) => post.title), september22Selection.selected.map((index) => september22Candidates[index][0]));
  for (const rejected of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) {
    assert.ok(!new Set<number>(september22Selection.selected).has(rejected));
  }
  assert.equal(september22Selection.semanticReview.length, posts.length);
  assert.equal(september22Research.baseCommit, "1bec92e2617aab57135b8b58bf382609850c7981");
  assert.ok(september22Research.sources.some((source) => source.includes("lta.gov.sg")));
  assert.ok(september22Research.sources.some((source) => source.includes("weather.go.kr")));
  const count = (...categories: string[]) => posts.filter((post) => categories.includes(post.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 22일 제목과 본문은 같은 장면을 담고 자연스러운 2~4문장으로 끝난다", () => {
  const anchors = [
    /(?=.*차)(?=.*한 정거장)/u,
    /(?=.*저녁)(?=.*겉옷)/u,
    /(?=.*택배 상자)(?=.*이름표)/u,
    /(?=.*친구)(?=.*좋은 소식)/u,
    /(?=.*명절)(?=.*못 가)/u,
    /(?=.*무인계산대)(?=.*세 사람)/u,
    /(?=.*카트)(?=.*바퀴)/u,
    /(?=.*가족)(?=.*달)/u,
    /(?=.*제목)(?=.*첫 문단)/u,
    /(?=.*소설)(?=.*두 시간)/u,
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

test("9월 22일 당일 정보와 생활 조언은 확인된 범위와 조건을 지킨다", () => {
  assert.match(posts[0].content, /9월 22일 세계 차 없는 날/u);
  assert.match(posts[0].content, /무리 없는 한 구간/u);
  assert.doesNotMatch(posts[0].content, /의무|금지|모든 사람|탄소.*감소/u);
  assert.match(posts[1].content, /낮과 밤의 기온 차/u);
  assert.doesNotMatch(posts[1].content, /감기|질환|예방|치료/u);
  assert.match(posts[2].content, /주소와 이름/u);
  assert.match(posts[3].content, /시간이 필요/u);
  assert.match(posts[4].content, /영상통화/u);
  assert.match(posts[5].content, /직원은 화면 오류를 확인/u);
  assert.match(posts[6].content, /카트 상태를 알린 뒤 교체/u);
  assert.match(posts[7].content, /서로 다른 동네/u);
  assert.match(posts[8].content, /본문 단서/u);
  assert.match(posts[9].content, /정확한 시간이 없는 장면은 억지로 채우지 않고/u);
});

test("9월 22일 작성자명 113개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
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

test("9월 22일 댓글 103개는 글마다 9~12개이고 시간에 맞춰 차례로 공개된다", () => {
  assert.deepEqual(posts.map((post) => commentsFor(post.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9, 10]);
  assert.equal(comments.length, 103);
  const postTimes = posts.map((post) => Date.parse(post.createdAt));
  assert.ok(postTimes.every((time, index) => index === 0 || time > postTimes[index - 1]));
  for (const post of posts) {
    assert.match(post.createdAt, /^2026-09-22T/u);
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
  assert.ok(comments.some((comment) => Date.parse(comment.createdAt) >= Date.parse("2026-09-23T00:00:00+09:00")));
});

test("글마다 최소 다섯 댓글이 해당 장면을 기발한 유머로 확장한다", () => {
  const playful = [
    [/지도에는 없던/u, /배경화면/u, /환승/u, /시야를 먼저 수선/u, /빵집 냄새/u],
    [/구조대 조끼/u, /야간조/u, /일일권/u, /피고석/u, /상시 대기/u],
    [/단체 여행/u, /숨바꼭질/u, /신원 확인/u, /신분 세탁/u, /왕복권/u],
    [/좌석 하나/u, /메일함만 겨울/u, /당일 소인/u, /공동 문서/u, /다시 켜/u],
    [/장거리 운전/u, /창구/u, /단톡방 투표/u, /명절상/u, /같은 자/u],
    [/문단으로 모였/u, /골키퍼/u, /졸업/u, /가장 인간적인/u, /회계 결재/u],
    [/소수 의견/u, /선거운동/u, /노동 분쟁/u, /음성으로 제출/u, /민주주의/u],
    [/관측소/u, /동네 유명인/u, /증명사진/u, /현황 보고/u, /감자처럼/u],
    [/대리 근무/u, /안테나/u, /아직 잘 모르겠습니다/u, /오답지/u, /정답 발표/u],
    [/생활지도 교사/u, /일정 관리 앱/u, /운행 계획/u, /분 단위 증언/u, /환승 보상/u],
  ];
  posts.forEach((post, index) => {
    const bodies = commentsFor(post.id).map((comment) => comment.body).join(" ");
    assert.ok(playful[index].every((pattern) => pattern.test(bodies)), post.id);
  });
});

test("9월 22일 피드 연결은 새 글과 공개 시점의 댓글만 더한다", () => {
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
