import { foundationPostIds } from "../lib/community-foundation-20261121";
import assert from 'node:assert/strict';
import test from 'node:test';
import { readerComments20261024 as entries } from '../lib/reader-comments-20261024';
import { builtInComments, builtInPosts } from '../lib/built-in-content';
import { hasPii, reviewText } from '../lib/safety';
import { likeBoost, withLikeBoost } from '../lib/like-boost';
import { november17EditorialPostIds, november21EditorialPostIds } from '../lib/daily-editorial-20261117';

test('Every built-in post gets exactly one safe, unique reader comment', () => {
  // Snapshot of 2026-10-24: posts published after that date have their own comment sets.
  const postsAtSnapshot = builtInPosts.filter(p => Date.parse(p.createdAt) < Date.parse('2026-10-25T00:00:00+09:00'));
  assert.equal(entries.length, postsAtSnapshot.length);
  assert.equal(new Set(entries.map(e => e.postId)).size, postsAtSnapshot.length);
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
  assert.equal(new Set(entries.map(e => e.body)).size, entries.length);
  for (const entry of entries) {
    const post = builtInPosts.find(p => p.id === entry.postId);
    assert.ok(post, entry.postId);
    assert.ok(Date.parse(entry.createdAt) >= Date.parse(post.createdAt));
    assert.equal(entry.displayName.split(' ').length, 2);
    assert.doesNotMatch(entry.body, /운영팀|제가 겪|나도 해봤|저도 해봤|\.\.\.|…/);
    assert.equal(hasPii(entry.body), false);
    assert.equal(reviewText(entry.body).riskLevel, 'low');
    assert.equal(builtInComments(entry.postId).filter(c => c.id === entry.id).length, 1);
  }
});

test('Existing like boosts stay stable; November 17 posts receive no fabricated likes', () => {
  for (const post of builtInPosts) {
    const boost = likeBoost(post.id);
    if (november17EditorialPostIds.has(post.id)) {
      assert.equal(boost, 0);
      assert.equal(post.heard, 0);
      assert.equal(builtInComments(post.id).length, 10);
    } else if (foundationPostIds.has(post.id)) {
      assert.equal(boost, 0);
      assert.equal(post.heard, 0);
      assert.equal(builtInComments(post.id).length, 10);
    } else if (november21EditorialPostIds.has(post.id)) {
      assert.equal(boost, 0);
      assert.equal(post.heard, 0);
      assert.equal(builtInComments(post.id).length, 0);
    } else {
      assert.ok(boost >= 10 && boost <= 15);
    }
    assert.equal(boost, likeBoost(post.id));
    assert.equal(withLikeBoost(post).heard, post.heard + boost);
  }
});
