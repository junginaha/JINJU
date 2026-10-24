import { warmOperatorNotes } from "../lib/operator-notes-20261023";
import assert from 'node:assert/strict';
import test from 'node:test';
import { october23EditorialPosts as posts, october23OperatorReplies as replies, october23ReplyTargets as targets, october23ReleaseAt as release } from '../lib/daily-editorial-20261023';
import { builtInPosts, builtInComments as allBuiltInComments } from '../lib/built-in-content';
// Operator-requested reader comments (2026-10-24) are checked in their own test.
const builtInComments = (id: string) => allBuiltInComments(id).filter((c) => !c.id.startsWith("reader-20261024-"));
import { supplementalComments } from '../lib/supplemental-comments';
import { createDuplicatePostChecker, similarity } from '../lib/dedup';
import { hasPii, reviewText } from '../lib/safety';
import { visibleCommentsAt } from '../lib/comment-time';

test('October23 operator posts contain no invented engagement or duplicate articles',()=>{
  assert.equal(posts.length,9);
  const duplicate=createDuplicatePostChecker();
  for(const p of posts){
    const stored=builtInPosts.find(x=>x.id===p.id)!;assert.ok(stored);
    assert.notEqual(stored.displayName,'진주 운영팀');
    assert.equal(stored.displayName?.split(' ').length,2);
    assert.deepEqual([stored.heard,stored.same,stored.support,stored.commentCount],[0,0,0,0]);
    assert.equal(stored.createdAt,release);
    assert.deepEqual(builtInComments(p.id).filter(c=>!c.id.startsWith("conversation-20261024-")),warmOperatorNotes(p.id));assert.deepEqual(supplementalComments(p),[]);
    for(const old of builtInPosts.filter(x=>x.id!==p.id)){
      assert.equal(duplicate(p,old),false,p.title+' / '+old.title);
      assert.ok(similarity(p.content,old.content)<0.5,p.title+' / '+old.title);
    }
  }
});
test('October23 replies are attributed to the operator and target only the two new stored comments',()=>{
  assert.equal(targets.length,2);
  for(const t of targets){
    const cs=replies(t.postId);assert.equal(cs.length,1);
    assert.equal(cs[0].id,`operator-reply-20261023-${t.commentId}`);
    assert.equal(cs[0].displayName,'진주 운영팀');assert.doesNotMatch(cs[0].body,/운영팀 답글|AI가/);
    assert.ok(cs[0].body.length>180);assert.ok(Date.parse(release)>Date.parse(t.createdAt));
    assert.equal(visibleCommentsAt(cs,Date.parse(release)-1).length,0);
    assert.equal(visibleCommentsAt(cs,Date.parse(release)).length,1);
    assert.equal(builtInComments(t.postId).filter(c=>c.id===cs[0].id).length,1);
  }
  assert.deepEqual(replies('jinju-daily-20260928-apology-without-intent-first'),[]);
});
test('October23 language safety and publication date',()=>{
  assert.match(release,/^2026-10-23T/);
  for(const text of [...posts.map(p=>p.title+' '+p.content),...targets.flatMap(t=>replies(t.postId).map(c=>c.body))]){
    assert.equal(hasPii(text),false,text);assert.equal(reviewText(text).riskLevel,'low',text);
    assert.doesNotMatch(text,/\.\.\.|…/);
  }
});
