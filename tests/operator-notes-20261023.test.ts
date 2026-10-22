import assert from 'node:assert/strict';
import test from 'node:test';
import { warmNewsPost as post, warmOperatorNotes as notes, warmNewsAudit as audit } from '../lib/operator-notes-20261023';
import { october23EditorialPosts } from '../lib/daily-editorial-20261023';
import { builtInPosts, builtInComments } from '../lib/built-in-content';
import { createDuplicatePostChecker } from '../lib/dedup';
import { hasPii, reviewText } from '../lib/safety';

test('Operator supplements have explicit attribution, context and zero fabricated reactions',()=>{
  const targets=[...october23EditorialPosts,post];
  const all=targets.flatMap(p=>{
    const comments=notes(p.id);assert.equal(comments.length,1);
    assert.equal(comments[0].displayName,'진주 운영팀');assert.match(comments[0].body,/운영팀/);
    assert.ok(comments[0].body.length>=180);
    assert.ok(Date.parse(comments[0].createdAt)>=Date.parse(p.createdAt));
    assert.equal(builtInComments(p.id).filter(c=>c.id===comments[0].id).length,1);
    assert.equal(hasPii(comments[0].body),false);assert.equal(reviewText(comments[0].body).riskLevel,'low');
    return comments;
  });
  assert.equal(new Set(all.map(c=>c.id)).size,10);assert.equal(new Set(all.map(c=>c.body)).size,10);
  assert.deepEqual(notes('unrelated-post'),[]);
  assert.deepEqual([post.heard,post.same,post.support,post.commentCount],[0,0,0,0]);
  assert.equal(builtInPosts.find(p=>p.id===post.id)?.heard,0);
});
test('News preserves research uncertainty and internal source evidence',()=>{
  assert.match(post.content,/확정 결론은 아니/);assert.match(post.content,/이견/);
  assert.match(post.content,/10월 22일/);assert.equal(audit.paperPublished,'2026-10-22');
  assert.match(audit.primary,/github.com\/sllabinc\/StarryNight/);
  assert.equal(hasPii(post.content),false);assert.equal(reviewText(post.content).riskLevel,'low');
  const duplicate=createDuplicatePostChecker();
  for(const old of builtInPosts.filter(p=>p.id!==post.id))assert.equal(duplicate(post,old),false,old.title);
});
