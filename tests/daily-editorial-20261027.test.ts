import assert from "node:assert/strict";
import test from "node:test";
import { october27EditorialComments, october27EditorialPosts } from "../lib/daily-editorial-20261027";
import { builtInComments, builtInPosts } from "../lib/built-in-content";
import { hasPii, reviewText } from "../lib/safety";

test("October 27 update: three issue posts with 8-10 comments each, published", () => {
  assert.equal(october27EditorialPosts.length, 3);
  for (const post of october27EditorialPosts) {
    assert.ok(builtInPosts.some((item) => item.id === post.id), post.id);
    const comments = october27EditorialComments(post.id);
    assert.ok(comments.length >= 8 && comments.length <= 10, `${post.id}: ${comments.length}`);
    assert.equal(builtInComments(post.id).filter((item) => item.id.startsWith("editorial-comment-20261027-")).length, comments.length);
    for (const comment of comments) {
      assert.ok(Date.parse(comment.createdAt) > Date.parse(post.createdAt));
      assert.equal(comment.displayName.split(" ").length, 2);
      assert.equal(hasPii(comment.body), false);
      assert.equal(reviewText(comment.body).riskLevel, "low", comment.body);
    }
  }
});

test("October 27 update keeps the house wording rules", () => {
  const text = october27EditorialPosts.flatMap((post) => [post.title, post.content, ...october27EditorialComments(post.id).map((c) => c.body + c.displayName)]).join("\n");
  assert.doesNotMatch(text, /운영진/);
  assert.doesNotMatch(text, /\bAI\b/);
  const ids = october27EditorialPosts.flatMap((post) => october27EditorialComments(post.id).map((c) => c.id));
  assert.equal(new Set(ids).size, ids.length);
  const names = october27EditorialPosts.flatMap((post) => october27EditorialComments(post.id).map((c) => c.displayName));
  assert.equal(new Set(names).size, names.length);
});
