import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createJinjuMcpHandler, type McpPublicPost } from "../lib/jinju-mcp";

const posts: McpPublicPost[] = [
  { id: "older", title: "책 모임", content: "북클럽에서 나눈 질문", category: "질문", displayName: "독자", createdAt: "2020-01-01T00:00:00Z", commentCount: 1 },
  { id: "newer", title: "일상", content: "산책 이야기", category: "일상", displayName: "산책자", createdAt: "2021-01-01T00:00:00Z", commentCount: 0 },
  { id: "future", title: "예약 글", content: "아직 공개되지 않음", category: "질문", displayName: "독자", createdAt: "2999-01-01T00:00:00Z", commentCount: 0 },
];

async function connect(load = async () => posts) {
  const handler = createJinjuMcpHandler(load);
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL("https://xn--o55b9n.kr/mcp"), {
    fetch: (input, init) => handler(new Request(input, init)),
  }));
  return client;
}

test("SDK client initializes and exposes only read tools", async () => {
  const client = await connect();
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(tool => tool.name).sort(), ["jinju_get_post", "jinju_search_posts"]);
    assert.ok(tools.every(tool => tool.annotations?.readOnlyHint === true));
    const response = await client.callTool({ name: "jinju_search_posts", arguments: { limit: 1 } });
    const data = response.structuredContent as { posts: McpPublicPost[]; nextOffset: number; total: number };
    assert.equal(data.posts[0].id, "newer");
    assert.equal(data.total, 2);
    assert.equal(data.nextOffset, 1);
  } finally { await client.close(); }
});

test("search, pagination and full text work without exposing extra source fields", async () => {
  const client = await connect(async () => posts.map(post => ({ ...post, internalToken: "must-not-leak" })));
  try {
    const search = await client.callTool({ name: "jinju_search_posts", arguments: { query: "북클럽", category: "질문" } });
    assert.equal((search.structuredContent as { total: number }).total, 1);
    const full = await client.callTool({ name: "jinju_get_post", arguments: { id: "older" } });
    assert.equal((full.structuredContent as { post: McpPublicPost }).post.content, posts[0].content);
    assert.ok(!JSON.stringify(full).includes("must-not-leak"));
    const page = await client.callTool({ name: "jinju_search_posts", arguments: { offset: 1, limit: 1 } });
    assert.equal((page.structuredContent as { posts: McpPublicPost[] }).posts[0].id, "older");
    for (const id of ["future", "missing"]) {
      assert.equal((await client.callTool({ name: "jinju_get_post", arguments: { id } })).isError, true);
    }
    assert.equal((await client.callTool({ name: "jinju_search_posts", arguments: { limit: 1000 } })).isError, true);
  } finally { await client.close(); }
});

test("data failure returns an error without internal details", async () => {
  const client = await connect(async () => { throw new Error("database-secret"); });
  try {
    const response = await client.callTool({ name: "jinju_search_posts", arguments: {} });
    assert.equal(response.isError, true);
    assert.ok(!JSON.stringify(response).includes("database-secret"));
  } finally { await client.close(); }
});

test("rejects foreign origins and unsupported methods without loading data", async () => {
  const handler = createJinjuMcpHandler(async () => { throw new Error("must not read"); });
  assert.equal((await handler(new Request("https://xn--o55b9n.kr/mcp", { method: "POST", headers: { origin: "https://example.com" } }))).status, 403);
  assert.equal((await handler(new Request("https://xn--o55b9n.kr/mcp"))).status, 405);
});
