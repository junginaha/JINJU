import { editorialComments, editorialPosts } from "../lib/editorial";
import { generateAutoCommentBodies } from "../lib/auto-comments";

const problems: string[] = [];
const generatedBodies = new Map<string, string>();
const generatedNames = new Map<string, string>();
const formal = /필요합니다|중요합니다|생각합니다|보입니다|바랍니다|검토해야|되어야 합니다|할 것입니다|라는 대목|라는 문장/;

for (const post of editorialPosts) {
  const comments = editorialComments(post.id);
  if (comments.length !== 2) problems.push(`${post.id}: 댓글 ${comments.length}개`);
  for (const comment of comments) {
    if (!comment.body.trim()) problems.push(`${comment.id}: 빈 댓글`);
    if (comment.body.length > 140) problems.push(`${comment.id}: ${comment.body.length}자`);
    if (formal.test(comment.body)) problems.push(`${comment.id}: 설명문 말투`);
    const priorBody = generatedBodies.get(comment.body);
    if (priorBody) problems.push(`${comment.id}: 본문 중복(${priorBody})`);
    else generatedBodies.set(comment.body, comment.id);
    const priorName = generatedNames.get(comment.displayName);
    if (priorName) problems.push(`${comment.id}: 작성자 중복(${priorName})`);
    else generatedNames.set(comment.displayName, comment.id);
  }
}

const futureSamples = [
  { id: "a", title: "답장을 미루다가 또 하루가 지났어요", content: "잘 쓰고 싶어서 미뤘습니다.", category: "관계", createdAt: new Date().toISOString() },
  { id: "b", title: "회사에 AI가 들어왔는데 왜 더 바쁘죠", content: "일은 빨라졌는데 양이 늘었습니다.", category: "직장", createdAt: new Date().toISOString() },
  { id: "c", title: "비 오는 날의 작은 실수", content: "우산을 두고 나왔어요.", category: "일상", createdAt: new Date().toISOString() },
];
async function validateFutureComments() {
  for (const sample of futureSamples) {
    const comments = await generateAutoCommentBodies(sample);
    if (comments.length !== 2) problems.push(`미래 댓글 ${sample.id}: ${comments.length}개`);
    if (comments.some((body) => formal.test(body) || body.length > 140)) problems.push(`미래 댓글 ${sample.id}: 말투`);
  }
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(JSON.stringify({
    posts: editorialPosts.length,
    generatedComments: generatedBodies.size,
    uniqueBodies: generatedBodies.size,
    uniqueDisplayNames: generatedNames.size,
    futureCommentsPerPost: 2,
  }, null, 2));
}

void validateFutureComments();
