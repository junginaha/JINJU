import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { september15Candidates, september15EditorialComments as commentsFor, september15EditorialPosts as posts, september15Research, september15Selection } from "../lib/daily-editorial-20260915";
import { editorialDiversityIssues } from "../lib/editorial-diversity";
import { normalizeCommentTimes } from "../lib/comment-time";
import { createDuplicatePostChecker } from "../lib/dedup";
import { hasPii, reviewText } from "../lib/safety";

const old = builtInPosts.filter(p => !p.id.startsWith("jinju-daily-20260915-"));
const comments = posts.flatMap(p => commentsFor(p.id));

test("9월 15일 후보 20개에서 중복 구조를 제외하고 분야별 10편을 선정한다", () => {
  assert.equal(september15Candidates.length, 20);
  assert.equal(posts.length, 10);
  assert.equal(new Set(september15Selection.selected).size, posts.length);
  assert.deepEqual(posts.map(p => p.title), september15Selection.selected.map(i => september15Candidates[i][0]));
  for (const rejected of [1, 3, 5, 8, 9, 12, 14, 17, 18, 19]) assert.ok(!new Set<number>(september15Selection.selected).has(rejected));
  assert.equal(september15Selection.semanticReview.length, posts.length);
  assert.ok(september15Research.sources.some(s => s.includes("apple.com/newsroom/2026/09")));
  assert.ok(september15Research.sources.some(s => s.includes("theverge.com/news")));
  assert.equal(september15Research.baseCommit, "2c5e94145ece472f8edca64e49087944f2861d75");
  const count = (...categories: string[]) => posts.filter(p => categories.includes(p.category)).length;
  assert.ok(count("시사") >= 1);
  assert.ok(count("생활") >= 2);
  assert.ok(count("관계", "감정") >= 2);
  assert.ok(count("유머", "따뜻함") >= 2);
  assert.ok(count("책") >= 1);
});

test("9월 15일 제목과 본문은 같은 장면을 담고 자연스러운 2~4문장으로 끝난다", () => {
  const anchors = [/(?=.*업데이트)(?=.*권한)/u, /(?=.*단추)(?=.*옷)/u, /(?=.*옷장)(?=.*(?:앞줄|출근))/u, /(?=.*예전)(?=.*오늘)/u, /(?=.*도움)(?=.*마음)/u, /(?=.*스테이플러)(?=.*심)/u, /(?=.*집게)(?=.*냉장고)/u, /(?=.*메뉴판)(?=.*다음)/u, /(?=.*질문)(?=.*대화)/u, /(?=.*하지만)(?=.*방향)/u];
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
});

test("9월 15일 당일 정보와 생활 조언은 조건과 주의점을 함께 둔다", () => {
  assert.match(posts[0].content, /애플/u);
  assert.match(posts[0].content, /운영체제 업데이트 배포/u);
  assert.match(posts[0].content, /사진·마이크·위치 권한/u);
  assert.doesNotMatch(posts[0].content, /모든 기기|한국어 지원|반드시 설치|성능 향상 보장/u);
  assert.match(posts[1].content, /옷 종류와 색, 산 해/u);
  assert.match(posts[2].content, /한 달 뒤/u);
  assert.match(posts[6].content, /무리하게 움직이지 않고/u);
  assert.match(posts[8].content, /누가 자주 묻고/u);
  assert.match(posts[9].content, /앞에서 세운 주장/u);
});

test("9월 15일 작성자명 113개는 두 단어이며 기존 전체 시드와 중복되지 않는다", () => {
  const oldNames = new Set(old.flatMap(p => [String(p.displayName), ...builtInComments(p.id).map(c => c.displayName)]));
  const names = [...posts.map(p => String(p.displayName)), ...comments.map(c => c.displayName)];
  assert.equal(names.length, 113);
  assert.equal(new Set(names).size, names.length);
  for (const name of names) {
    assert.equal(name.trim().split(/\s+/u).length, 2, name);
    assert.ok(!oldNames.has(name), name);
  }
  const oldBodies = new Set(old.flatMap(p => builtInComments(p.id).map(c => c.body.trim())));
  assert.equal(new Set(comments.map(c => c.body)).size, comments.length);
  assert.ok(comments.every(c => !oldBodies.has(c.body.trim())));
});

test("9월 15일 댓글 103개는 글마다 9~12개이고 시간에 맞춰 차례로 공개된다", () => {
  assert.deepEqual(posts.map(p => commentsFor(p.id).length), [9, 10, 11, 12, 9, 10, 11, 12, 9, 10]);
  assert.equal(comments.length, 103);
  const times = posts.map(p => Date.parse(p.createdAt));
  assert.equal(new Set(times.slice(1).map((t, i) => t - times[i])).size, posts.length - 1);
  for (const p of posts) {
    assert.match(p.createdAt, /^2026-09-15T/u);
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
  assert.ok(comments.some(c => Date.parse(c.createdAt) >= Date.parse("2026-09-16T00:00:00+09:00")));
});

test("글마다 최소 다섯 댓글이 해당 장면을 기발한 유머로 확장한다", () => {
  const playful = [
    [/손전등/u, /월세/u, /팝콘/u, /야간 당직/u, /전문화/u],
    [/주소 불명/u, /같은 동네/u, /분실물/u, /오디션/u, /박수/u],
    [/끼어들기/u, /광역 통근/u, /인사고과/u, /주연/u, /폐회/u],
    [/평생 이용권/u, /냉장고 구석/u, /면허증/u, /계약/u, /우정 앱/u],
    [/자동 입장/u, /분리배출/u, /설득 대회/u, /미수금/u, /재촉 알림/u],
    [/출석/u, /운세/u, /효과음/u, /공동 책임/u, /마사지/u],
    [/취업/u, /같은 회사/u, /새 삶/u, /임시 계약/u, /범인/u],
    [/점심 계주/u, /완주 메달/u, /이동식 도서관/u, /전 메뉴 시식/u, /협력 협정/u],
    [/호기심 창고/u, /도망 경로/u, /회전교차로/u, /휴게시간/u, /결석/u],
    [/비상구/u, /노란불/u, /차선/u, /노선도/u, /신도시/u],
  ];
  posts.forEach((p, i) => {
    const bodies = commentsFor(p.id).map(c => c.body).join(" ");
    assert.ok(playful[i].every(pattern => pattern.test(bodies)), p.id);
  });
});

test("9월 15일 피드 연결은 새 글과 공개 시점의 댓글만 더한다", () => {
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
