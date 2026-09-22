import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import {
  september23Candidates,
  september23EditorialComments as commentsFor,
  september23EditorialPosts as posts,
  september23Research,
  september23Selection,
} from "../lib/daily-editorial-20260923";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter((post) => !post.id.startsWith("jinju-daily-20260923-"));
const comments = posts.flatMap((post) => commentsFor(post.id));

test("9월 23일 후보 20개에서 반복 구조를 제외하고 분야별 10편을 선정한다", () => {
  assert.equal(september23Candidates.length, 20);
  assert.equal(posts.length, 10);
  assert.equal(new Set(september23Selection.selected).size, posts.length);
  assert.deepEqual(posts.map((post) => post.title), september23Selection.selected.map((index) => september23Candidates[index][0]));
  for (const rejected of [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) {
    assert.ok(!new Set<number>(september23Selection.selected).has(rejected));
  }
  assert.equal(september23Selection.semanticReview.length, posts.length);
  assert.equal(september23Research.baseCommit, "67f98992a393b50e7aa25dca2dd16e5c87aae17b");
  assert.ok(september23Research.sources.some((source) => source.includes("aa.usno.navy.mil")));
  assert.ok(september23Research.sources.some((source) => source.includes("theguardian.com")));
  const count = (...categories: string[]) => posts.filter((post) => categories.includes(post.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 23일 제목과 본문은 같은 장면을 담고 자연스러운 2~4문장으로 끝난다", () => {
  const anchors = [
    /(?=.*추분)(?=.*낮과 밤)/u,
    /(?=.*알람)(?=.*장소)/u,
    /(?=.*불 꺼진 집)(?=.*한 장)/u,
    /(?=.*화난)(?=.*메모장)/u,
    /(?=.*오랜만)(?=.*변명)/u,
    /(?=.*대답은 내일)(?=.*메시지)/u,
    /(?=.*청소)(?=.*만보기)/u,
    /(?=.*세탁소)(?=.*천 원)/u,
    /(?=.*좋았다)(?=.*책)/u,
    /(?=.*결말)(?=.*첫 장)/u,
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

test("9월 23일 당일 정보와 생활 조언은 확인된 범위와 조건을 지킨다", () => {
  assert.match(posts[0].content, /추분/u);
  assert.match(posts[0].content, /정확히 반반이 아니/u);
  assert.doesNotMatch(posts[0].content, /모든 지역|무조건|정확히 열두 시간씩 나뉜/u);
  assert.match(posts[1].content, /시각과 장소/u);
  assert.match(posts[2].content, /직접 전원과 창문을 확인/u);
  assert.match(posts[3].content, /추측은 지우고/u);
  assert.match(posts[4].content, /다음 주 점심 날짜/u);
  assert.match(posts[5].content, /지금 답하지 말고 내일/u);
  assert.doesNotMatch(posts[6].content, /운동 효과|건강 개선|칼로리/u);
  assert.match(posts[7].content, /왼쪽 주머니/u);
  assert.match(posts[8].content, /장면과 인물의 행동/u);
  assert.match(posts[9].content, /첫 장만 다시/u);
});

test("9월 23일 작성자명 113개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
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

test("9월 23일 댓글 103개는 글마다 9~12개이고 시간에 맞춰 차례로 공개된다", () => {
  assert.deepEqual(posts.map((post) => commentsFor(post.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9, 10]);
  assert.equal(comments.length, 103);
  const postTimes = posts.map((post) => Date.parse(post.createdAt));
  assert.ok(postTimes.every((time, index) => index === 0 || time > postTimes[index - 1]));
  for (const post of posts) {
    assert.match(post.createdAt, /^2026-09-23T/u);
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
  assert.ok(comments.some((comment) => Date.parse(comment.createdAt) >= Date.parse("2026-09-24T00:00:00+09:00")));
});

test("글마다 최소 다섯 댓글이 해당 장면을 기발한 유머로 확장한다", () => {
  const playful = [
    [/종이를 살짝/u, /반반 쿠폰/u, /반팔 직원/u, /하늘 회계팀/u, /여름의 각주/u],
    [/목적지를 추리/u, /완성된 문장/u, /환승역/u, /주소록을 한 바퀴/u, /작은 역무실/u],
    [/종결 도장/u, /왕복 공연/u, /오늘의 작품/u, /다리미가 쉬/u, /냉장고만 당직/u],
    [/노란불/u, /재판문/u, /숙성된/u, /밤 열두 시의 엄지/u, /정규직/u],
    [/변명표/u, /자동 로그아웃/u, /일정관리 앱/u, /창고에 쌓/u, /데이터 사용량/u],
    [/입주/u, /야간 개장/u, /서버가 야간 근무/u, /정시에 출근/u, /노트북이 다시/u],
    [/거실 마라톤/u, /관대/u, /반환점/u, /해발고도/u, /폐회식/u],
    [/신분이 상승/u, /무인 금고/u, /지폐의 허리/u, /눈을 내린/u, /보물찾기/u],
    [/10분 휴가/u, /증인을 데리고/u, /시스템 오류/u, /단어 하나가 퇴근/u, /야근/u],
    [/입구가 출구/u, /독자만 한 권만큼/u, /왕복표/u, /복선으로 체포/u, /답장을 보냈/u],
  ];
  posts.forEach((post, index) => {
    const bodies = commentsFor(post.id).map((comment) => comment.body).join(" ");
    assert.ok(playful[index].every((pattern) => pattern.test(bodies)), post.id);
  });
});

test("9월 23일 피드 연결은 새 글과 공개 시점의 댓글만 더한다", () => {
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
