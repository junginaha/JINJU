import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september20Candidates,
  september20EditorialComments as commentsFor,
  september20EditorialPosts as posts,
  september20Research,
  september20Selection,
} from "../lib/daily-editorial-20260920";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260920-"));
const comments = posts.flatMap((post) => commentsFor(post.id));

test("9월 20일 후보 20개에서 중복 구조를 제외하고 분야별 10편을 선정한다", () => {
  assert.equal(september20Candidates.length, 20);
  assert.equal(posts.length, 10);
  assert.equal(new Set(september20Selection.selected).size, posts.length);
  assert.deepEqual(posts.map((post) => post.title), september20Selection.selected.map((index) => september20Candidates[index][0]));
  for (const rejected of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) {
    assert.ok(!new Set<number>(september20Selection.selected).has(rejected));
  }
  assert.equal(september20Selection.semanticReview.length, posts.length);
  assert.equal(september20Research.baseCommit, "83fba79985a35526b710c39f33b692d4795588d2");
  assert.ok(september20Research.sources.some((source) => source.includes("aichi-nagoya2026.org")));
  assert.ok(september20Research.sources.some((source) => source.includes("oca.asia")));
  assert.ok(september20Research.sources.some((source) => source.includes("reuters.com/sports/asian-games")));
  const count = (...categories: string[]) => posts.filter((post) => categories.includes(post.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 20일 제목과 본문은 같은 장면을 담고 자연스러운 2~4문장으로 끝난다", () => {
  const anchors = [
    /(?=.*종목)(?=.*응원)/u,
    /건전지/u,
    /(?=.*세탁망)(?=.*지퍼)/u,
    /(?=.*부탁)(?=.*기억)/u,
    /(?=.*사과)(?=.*마음)/u,
    /(?=.*이불커버)(?=.*양말)/u,
    /(?=.*장바구니)(?=.*차키)/u,
    /(?=.*신발)(?=.*관리실)/u,
    /(?=.*호칭)(?=.*밑줄)/u,
    /(?=.*식탁)(?=.*자리)/u,
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

test("9월 20일 당일 정보와 생활 조언은 사실 범위와 조건을 지킨다", () => {
  assert.match(posts[0].content, /아이치·나고야 아시안게임/u);
  assert.match(posts[0].content, /개막/u);
  assert.match(posts[0].content, /공식 일정과 기본 규칙/u);
  assert.doesNotMatch(posts[0].content, /우승|금메달 확정|생중계 보장|모든 경기/u);
  assert.match(posts[1].content, /우리 동네에서 안내하는 수거함/u);
  assert.match(posts[2].content, /제가 쓰는 세탁망/u);
  assert.match(posts[6].content, /지퍼 달린 같은 주머니/u);
  assert.match(posts[7].content, /발견한 층과 시간/u);
  assert.match(posts[8].content, /본문 근거/u);
  assert.match(posts[9].content, /앞뒤 문장을 근거/u);
});

test("9월 20일 작성자명 113개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
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

test("9월 20일 댓글 103개는 글마다 9~12개이고 시간에 맞춰 차례로 공개된다", () => {
  assert.deepEqual(posts.map((post) => commentsFor(post.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9, 10]);
  assert.equal(comments.length, 103);
  const postTimes = posts.map((post) => Date.parse(post.createdAt));
  assert.ok(postTimes.every((time, index) => index === 0 || time > postTimes[index - 1]));
  for (const post of posts) {
    assert.match(post.createdAt, /^2026-09-20T/u);
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
  assert.ok(comments.some((comment) => Date.parse(comment.createdAt) >= Date.parse("2026-09-21T00:00:00+09:00")));
});

test("글마다 최소 다섯 댓글이 해당 장면을 기발한 유머로 확장한다", () => {
  const playful = [
    [/작은 나라/u, /예열/u, /임시 해설위원회/u, /오늘 데뷔/u, /리모컨도 진정/u],
    [/서가/u, /다시 취업/u, /인사팀/u, /복직/u, /대기실/u],
    [/면허시험/u, /놀이공원/u, /안전벨트/u, /바깥에서 구경/u, /작은 항구/u],
    [/지연 이자/u, /구조 신호/u, /분실물 안내/u, /자동연장/u, /배심원/u],
    [/당일 배송/u, /복사본/u, /용서 도장/u, /민원 창구/u, /다음 버스/u],
    [/관리비/u, /부동산/u, /개인주의자/u, /예산은 확보/u, /월세/u],
    [/바코드/u, /옷이 억울/u, /먼 곳에서 출근/u, /피고는 무죄/u, /서비스 정신/u],
    [/귀가 작전/u, /관리실 면접/u, /독립을 선언/u, /왕복 승차권/u, /분실물처럼/u],
    [/온도계/u, /행정구역도/u, /빈 호칭/u, /인사팀/u, /밑줄이 인물/u],
    [/수사판/u, /국을 가져오느라/u, /의자도 줄거리/u, /주문 제작/u, /밥도 못 먹고/u],
  ];
  posts.forEach((post, index) => {
    const bodies = commentsFor(post.id).map((comment) => comment.body).join(" ");
    assert.ok(playful[index].every((pattern) => pattern.test(bodies)), post.id);
  });
});

test("9월 20일 피드 연결은 새 글과 공개 시점의 댓글만 더한다", () => {
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
