import { october23OperatorReplies } from "../lib/daily-editorial-20261023";
import assert from 'node:assert/strict';
import test from 'node:test';
import { builtInPosts, builtInComments } from '../lib/built-in-content';
import { october22EditorialPosts as posts, october22OperatorReplies as replies, october22Audit as audit, october22ReleaseAt as release, october22Candidates } from '../lib/daily-editorial-20261022';
import { supplementalComments } from '../lib/supplemental-comments';
import { visibleCommentsAt, normalizeCommentTimes } from '../lib/comment-time';
import { createDuplicatePostChecker, similarity } from '../lib/dedup';
import { hasPii, reviewText } from '../lib/safety';

test('October22 operator articles retain zero engagement and have no synthetic comments', () => {
  assert.equal(posts.length,9);
  assert.equal(october22Candidates.length,20);
  const duplicate=createDuplicatePostChecker();
  for(const p of posts){
    const published=builtInPosts.find(x=>x.id===p.id);
    assert.ok(published);
    assert.equal(published.heard,0);
    assert.equal(published.same,0);
    assert.equal(published.support,0);
    assert.equal(published.commentCount,0);
    assert.equal(published.displayName,'진주 운영팀');
    assert.equal(published.createdAt,release);
    assert.deepEqual(builtInComments(p.id),october23OperatorReplies(p.id));
    assert.deepEqual(supplementalComments(p),[]);
    for(const old of builtInPosts.filter(x=>!posts.some(n=>n.id===x.id))){
      assert.equal(duplicate(p,old),false,`${p.title} / ${old.title}`);
      assert.ok(similarity(p.content,old.content)<=0.5,p.title);
    }
  }
  assert.equal(builtInPosts.find(p=>p.id==='jinju-daily-20261021-fiction-object-auction')?.heard,28);
});

test('Operator replies target seven existing comments and appear only at the current release boundary',()=>{
  const ids=[...new Set(audit.replyTargets.map(t=>t.postId))];
  const comments=ids.flatMap(id=>replies(id));
  assert.equal(comments.length,7);
  assert.equal(new Set(comments.map(c=>c.id)).size,7);
  for(const target of audit.replyTargets){
    const reply=comments.find(c=>c.id===`operator-reply-20261022-${target.commentId}`);
    assert.ok(reply);
    assert.equal(reply.displayName,'진주 운영팀');
    assert.ok(reply.body.includes('운영팀 답글'));
    assert.ok(reply.body.length>=150);
    assert.ok(Date.parse(reply.createdAt)>Date.parse(target.createdAt));
    assert.equal(builtInComments(target.postId).filter(c=>c.id===reply.id).length,1);
  }
  for(const id of ids){
    const cs=replies(id);
    assert.equal(visibleCommentsAt(cs,Date.parse(release)-1).length,0);
    assert.equal(visibleCommentsAt(cs,Date.parse(release)+10).length,cs.length);
    const post=builtInPosts.find(p=>p.id===id)!;
    const normalized=normalizeCommentTimes(post.createdAt,builtInComments(id),Date.parse(release)+1000);
    for(const c of cs) assert.equal(normalized.find(x=>x.id===c.id)?.createdAt,c.createdAt);
  }
});

test('October22 safety and current-date publication without closing unfinished backlog',()=>{
  assert.equal(audit.editorialMissingDates.length,22);
  assert.equal(audit.replyTargets.length,7);
  assert.match(release,/^2026-10-22T/u);
  const ids=[...new Set(audit.replyTargets.map(t=>t.postId))];
  for(const text of [...posts.map(p=>p.title+' '+p.content),...ids.flatMap(id=>replies(id).map(c=>c.body))]){
    assert.equal(hasPii(text),false,text);
    assert.equal(reviewText(text).riskLevel,'low',text);
    assert.doesNotMatch(text,/\.\.\.|…/u);
  }
});
