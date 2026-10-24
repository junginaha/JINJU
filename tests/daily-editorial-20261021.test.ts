import assert from 'node:assert/strict';
import test from 'node:test';
import { builtInPosts, builtInComments as allBuiltInComments } from '../lib/built-in-content';
// Operator-requested reader comments (2026-10-24) are checked in their own test.
const builtInComments = (id: string) => allBuiltInComments(id).filter((c) => !c.id.startsWith("reader-20261024-"));
import { october21EditorialPosts as posts, october21EditorialComments as commentsFor, october21Candidates as candidates, october21Selection as selected } from '../lib/daily-editorial-20261021';
import { editorialDiversityIssues } from '../lib/editorial-diversity';
import { normalizeCommentTimes } from '../lib/comment-time';
import { createDuplicatePostChecker, similarity } from '../lib/dedup';
import { refinedJinjuDisplayName } from '../lib/display-name';
import { hasPii, reviewText } from '../lib/safety';

const old = builtInPosts.filter(p => !p.id.startsWith('jinju-daily-20261021-'));
const comments = posts.flatMap(p => commentsFor(p.id));
test('10월21일 분야와 후보·선정·문체·댓글 다양성', () => {
  assert.equal(candidates.length,21);
  assert.equal(posts.length,9);
  assert.deepEqual(posts.map(p=>p.title), selected.map(i=>candidates[i]));
  assert.deepEqual(editorialDiversityIssues(posts, commentsFor),[]);
  const count=(...cats:string[])=>posts.filter(p=>cats.includes(p.category)).length;
  assert.ok(count('시사')>=1 && count('생활')>=2 && count('관계','감정')>=2 && count('유머','따뜻함')>=2 && count('책')>=1);
  const anchors=[/인터넷 주소.*ICANN/u,/문풍지.*창/u,/스웨터.*보풀/u,/친구.*메뉴/u,/작은 작업실/u,/빗자루.*먼지/u,/신발 끈.*불/u,/전자책.*장 제목/u,/물건.*경매/u];
  posts.forEach((p,i)=>{
    assert.match(p.title+' '+p.content,anchors[i]);
    assert.ok((p.content.match(/[.!?]/gu)||[]).length>=2 && (p.content.match(/[.!?]/gu)||[]).length<=4);
    assert.ok(p.heard>=20 && p.heard<=33);
  });
  for(const text of [...posts.map(p=>p.title+' '+p.content),...comments.map(c=>c.body)]){
    assert.equal(hasPii(text),false,text);
    assert.equal(reviewText(text).riskLevel,'low',text);
    assert.doesNotMatch(text,/\.\.\.|…|까요\?|https?:\/\//u);
  }
  assert.ok(comments.every(c=>c.body.length>=65 && (c.body.match(/[.!?]/gu)||[]).length>=2));
});
test('10월21일 이름·중복·피드 연결',()=>{
  const oldNames=new Set(old.flatMap(p=>[String(p.displayName),...builtInComments(p.id).map(c=>c.displayName)]));
  const all=[...posts,...comments];
  assert.equal(new Set(all.map(p=>p.displayName)).size,129);
  all.forEach(p=>{
    const name=String(p.displayName);
    assert.equal(name.split(/\s/u).length,2);
    assert.equal(oldNames.has(name),false,name);
    assert.equal(refinedJinjuDisplayName(name,p.id),name);
  });
  const duplicate=createDuplicatePostChecker();
  for(const p of posts){
    assert.equal(builtInPosts.filter(x=>x.id===p.id).length,1);
    assert.deepEqual(builtInComments(p.id),commentsFor(p.id));
    assert.ok(!old.some(x=>duplicate(p,x)),p.title);
    assert.ok(!old.some(x=>similarity(p.content,x.content)>0.5),p.title);
  }
});
test('10월21일 120개 댓글 공개 시각과 배열 경계',()=>{
  assert.equal(comments.length,120);
  assert.equal(new Set(posts.map(p=>commentsFor(p.id).length)).size,4);
  for(const p of posts){
    assert.match(p.createdAt,/^2026-10-21T/u);
    const m=+p.createdAt.slice(11,13)*60 + +p.createdAt.slice(14,16);
    assert.ok(m>=420 && m<=1350);
    const cs=commentsFor(p.id);
    assert.ok(cs.length>=12 && cs.length<=15);
    cs.forEach((c,i)=>{
      const t=Date.parse(c.createdAt), delay=(t-Date.parse(p.createdAt))/60000;
      assert.ok(i<3 ? delay>=3 && delay<=18 : delay>=30);
      assert.equal(normalizeCommentTimes(p.createdAt,cs,t-1).length,i);
      assert.equal(normalizeCommentTimes(p.createdAt,cs,t).length,i+1);
    });
  }
  assert.ok(comments.some(c=>Date.parse(c.createdAt)>=Date.parse('2026-10-22T00:00:00+09:00')));
});
