import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september27Candidates,
  september27EditorialComments as commentsFor,
  september27EditorialPosts as posts,
  september27Research,
  september27Selection,
} from "../lib/daily-editorial-20260927";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260927-"));
const comments = posts.flatMap((post) => commentsFor(post.id));

test("9월 27일 후보 20개에서 반복 구조를 제외하고 분야별 10편을 선정한다", () => {
  assert.equal(september27Candidates.length, 20);
  assert.equal(posts.length, 10);
  assert.equal(new Set(september27Selection.selected).size, posts.length);
  assert.deepEqual(posts.map((post) => post.title), september27Selection.selected.map((index) => september27Candidates[index][0]));
  for (const rejected of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) {
    assert.ok(!new Set<number>(september27Selection.selected).has(rejected));
  }
  assert.equal(september27Selection.semanticReview.length, posts.length);
  assert.equal(september27Research.baseCommit, "e3d49df1eed17e5c8fb8c52a218c6f5cf09e313d");
  assert.ok(september27Research.sources.some((source) => source.includes("unwto.org")));
  assert.ok(september27Research.sources.some((source) => source.includes("surrey.ac.uk")));
  const count = (...categories: string[]) => posts.filter((post) => categories.includes(post.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 27일 제목과 본문은 같은 장면을 담고 자연스러운 2~4문장으로 끝난다", () => {
  const anchors = [
    /(?=.*전망)(?=.*계단)/u,
    /(?=.*세탁망)(?=.*건조기 금지)/u,
    /(?=.*검은 가방)(?=.*노란 파우치)/u,
    /(?=.*칭찬)(?=.*변명)/u,
    /(?=.*날짜)(?=.*체력)/u,
    /(?=.*붕어빵)(?=.*한 마리)/u,
    /(?=.*로봇청소기)(?=.*양말)/u,
    /(?=.*도서관)(?=.*종이꽃)/u,
    /(?=.*목차)(?=.*먼 장)/u,
    /(?=.*등장인물)(?=.*하지 못한 말)/u,
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

test("9월 27일 당일 정보와 실생활 조언은 확인된 범위와 조건을 지킨다", () => {
  assert.match(posts[0].content, /세계 관광의 날/u);
  assert.match(posts[0].content, /계단 세 칸/u);
  assert.doesNotMatch(posts[0].content, /모든 관광지|완벽한 접근|누구나 갈 수/u);
  assert.match(posts[1].content, /빨간 집게/u);
  assert.match(posts[2].content, /늘 같은 안쪽 주머니/u);
  assert.match(posts[3].content, /고맙다고 답/u);
  assert.match(posts[4].content, /차 한 잔/u);
  assert.match(posts[5].content, /미리 값을 내/u);
  assert.doesNotMatch(posts[6].content, /고장 없이|안전하다|자동으로 해결/u);
  assert.match(posts[7].content, /대출자 정보는 적지 않은/u);
  assert.match(posts[8].content, /예상과 달랐던 문장/u);
  assert.match(posts[9].content, /장면 두 곳/u);
});

test("9월 27일 작성자명 113개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
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

test("9월 27일 댓글 103개는 글마다 9~12개이고 시간에 맞춰 차례로 공개된다", () => {
  assert.deepEqual(posts.map((post) => commentsFor(post.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9, 10]);
  assert.equal(comments.length, 103);
  const postTimes = posts.map((post) => Date.parse(post.createdAt));
  assert.ok(postTimes.every((time, index) => index === 0 || time > postTimes[index - 1]));
  for (const post of posts) {
    assert.match(post.createdAt, /^2026-09-27T/u);
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
  assert.ok(comments.some((comment) => Date.parse(comment.createdAt) >= Date.parse("2026-09-28T00:00:00+09:00")));
});

test("글마다 최소 다섯 댓글이 해당 장면을 기발한 유머로 확장한다", () => {
  const playful = [
    [/무릎/u, /사용설명서/u, /현실적인 여행 편집장/u, /현관에서 끝/u, /독자의 여행 가능성/u],
    [/급행열차/u, /환승센터/u, /출국 금지/u, /아동복 사이즈/u, /종점/u],
    [/영수증 문명/u, /형광 조끼/u, /위장술/u, /밀입국/u, /학계에는 아쉬운/u],
    [/반송 도장/u, /겸손 창고/u, /세금 없이/u, /노동청/u, /할인 판매/u],
    [/매진 표시/u, /종합전형/u, /체력 잔액/u, /다이어트/u, /정규 편성/u],
    [/헤엄쳐/u, /낚싯대/u, /계절을 알려/u, /릴레이 배턴/u, /엄중한 임무/u],
    [/무단결근/u, /요금은 먼지/u, /종착역/u, /첨단화/u, /기내 방송/u],
    [/조용한 화단/u, /임시 연장/u, /이사했/u, /화훼팀/u, /향기는 없지만/u],
    [/가장 먼 역/u, /거울/u, /독서 교통비/u, /산을 일부러/u, /표정이 먼저/u],
    [/진술서/u, /야간 대필/u, /정식 원고/u, /계약 기간/u, /다시 지우/u],
  ];
  posts.forEach((post, index) => {
    const bodies = commentsFor(post.id).map((comment) => comment.body).join(" ");
    assert.ok(playful[index].every((pattern) => pattern.test(bodies)), post.id);
  });
});

test("9월 27일 피드 연결은 새 글과 공개 시점의 댓글만 더한다", () => {
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
