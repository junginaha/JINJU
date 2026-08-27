import assert from "node:assert/strict";
import test from "node:test";
import { validGithubSocialClaims } from "../lib/github-oidc";
import { buildSocialCopy, socialCampaign, socialPostUrl } from "../lib/social-copy";
import {
  configuredSocialPlatforms,
  publishInstagram,
  publishNaverCafe,
  publishThreads,
} from "../lib/social-providers";
import type { EditorialPost } from "../lib/editorial";

const post: EditorialPost = {
  id: "jinju-test-social",
  title: "단톡방 음성메시지는 몇 분까지 예의일까요?",
  content: "가족 단체방에 긴 음성메시지가 도착했습니다. 보내기는 편하지만 듣는 사람은 조용한 장소와 시간을 따로 찾아야 했어요.",
  category: "일상",
  displayName: "퇴근길 재생버튼",
  createdAt: "2026-08-26T09:00:00+09:00",
  heard: 24,
  same: 17,
  support: 0,
  commentCount: 9,
};

function env(values: Record<string, string>): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...values };
}

test("채널별 UTM과 한국 날짜 캠페인을 만든다", () => {
  const now = new Date("2026-08-26T15:20:00.000Z");
  assert.equal(socialCampaign(now), "jinju_daily_20260827");
  assert.equal(
    socialPostUrl(post.id, "threads", "jinju_daily_20260827"),
    "https://xn--o55b9n.kr/post/jinju-test-social?utm_source=threads&utm_medium=social&utm_campaign=jinju_daily_20260827",
  );
});

test("게시 묶음은 실제 링크와 자연스러운 채널 문구를 포함한다", () => {
  const copy = buildSocialCopy(post, new Date("2026-08-26T15:20:00.000Z"));
  assert.match(copy.instagram.caption, /가족 단체방/u);
  assert.match(copy.instagram.caption, /#진주kr/u);
  assert.match(copy.instagram.imageUrl, /\/api\/social\/card\/jinju-test-social$/u);
  assert.ok(copy.threads.text.length <= 500);
  assert.match(copy.naverCafe.content, /독립 익명 의견 커뮤니티/u);
  assert.match(copy.naverCafe.content, /utm_source=naver/u);
  assert.ok(copy.youtube.title.length <= 100);
  assert.match(copy.youtube.description, /음성은 AI로 생성/u);
  assert.match(copy.youtube.description, /utm_source=youtube/u);
  assert.match(copy.youtube.imageUrl, /\/api\/social\/youtube\/card\/jinju-test-social$/u);
  assert.ok(copy.youtube.script.length <= 360);
});

test("비밀값이 모두 있는 채널만 활성 대상으로 판정한다", () => {
  assert.deepEqual(configuredSocialPlatforms(env({
    INSTAGRAM_USER_ID: "ig-user",
    INSTAGRAM_ACCESS_TOKEN: "ig-token",
    THREADS_ACCESS_TOKEN: "threads-token",
    NAVER_CAFE_ID: "1",
    NAVER_CAFE_MENU_ID: "2",
    NAVER_ACCESS_TOKEN: "naver-token",
  })), ["instagram", "threads", "naver_cafe"]);
  assert.deepEqual(configuredSocialPlatforms(env({ INSTAGRAM_USER_ID: "ig-user" })), []);
});

test("GitHub OIDC는 main의 지정 워크플로만 허용한다", () => {
  const now = 1_787_800_000;
  const valid = {
    iss: "https://token.actions.githubusercontent.com",
    aud: "jinju-social-publisher",
    exp: now + 300,
    iat: now,
    repository: "junginaha/JINJU",
    ref: "refs/heads/main",
    event_name: "schedule",
    workflow_ref: "junginaha/JINJU/.github/workflows/social-publish.yml@refs/heads/main",
  };
  assert.equal(validGithubSocialClaims(valid, now), true);
  assert.equal(validGithubSocialClaims({ ...valid, ref: "refs/heads/feature" }, now), false);
  assert.equal(validGithubSocialClaims({ ...valid, aud: "another-service" }, now), false);
});

function mockJsonSequence(responses: Array<Record<string, unknown>>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchMock = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const body = responses.shift();
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return { fetchMock, calls };
}

test("Instagram은 생성·게시·공개주소 검증을 순서대로 수행한다", async () => {
  const copy = buildSocialCopy(post).instagram;
  const mock = mockJsonSequence([{ id: "container" }, { id: "media" }, { id: "media", permalink: "https://instagram.com/p/media" }]);
  const result = await publishInstagram(copy, env({
    INSTAGRAM_USER_ID: "user",
    INSTAGRAM_ACCESS_TOKEN: "token",
    META_GRAPH_VERSION: "v26.0",
  }), mock.fetchMock);
  assert.equal(result.publicUrl, "https://instagram.com/p/media");
  assert.match(mock.calls[0].url, /\/v26\.0\/user\/media$/u);
  assert.match(mock.calls[1].url, /\/media_publish$/u);
});

test("Threads는 텍스트 컨테이너를 게시하고 permalink를 확인한다", async () => {
  const mock = mockJsonSequence([{ id: "container" }, { id: "thread" }, { id: "thread", permalink: "https://threads.net/@jinju/post/thread" }]);
  const result = await publishThreads(buildSocialCopy(post).threads, env({
    THREADS_ACCESS_TOKEN: "token",
  }), mock.fetchMock);
  assert.equal(result.remoteId, "thread");
  assert.match(mock.calls[0].url, /graph\.threads\.net\/v1\.0\/me\/threads$/u);
});

test("네이버 카페 응답에서 실제 글 주소를 기록한다", async () => {
  const mock = mockJsonSequence([{ message: { result: { articleId: 17, articleUrl: "https://cafe.naver.com/example/17" } } }]);
  const result = await publishNaverCafe(buildSocialCopy(post).naverCafe, env({
    NAVER_ACCESS_TOKEN: "token",
    NAVER_CAFE_ID: "123",
    NAVER_CAFE_MENU_ID: "4",
  }), mock.fetchMock);
  assert.equal(result.publicUrl, "https://cafe.naver.com/example/17");
  assert.match(mock.calls[0].url, /\/v1\/cafe\/123\/menu\/4\/articles$/u);
});
