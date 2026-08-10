import assert from "node:assert/strict";
import test from "node:test";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { getPublicComments } from "../lib/public-comments";

test("public comment SSR data contains only fields already shown to visitors", async () => {
  const sample = builtInPosts.find((post) => builtInComments(post.id).length > 0);
  assert.ok(sample, "a built-in post with public comments is required");
  const result = await getPublicComments(sample.id);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.comments.length > 0);
  for (const comment of result.comments) {
    assert.deepEqual(Object.keys(comment).sort(), ["body", "createdAt", "displayName", "id"]);
    assert.ok(comment.body.length > 0);
  }
});
