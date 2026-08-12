import type { EditorialComment, EditorialPost } from "./editorial";

type CommentsForPost = (postId: string) => EditorialComment[];

const QUESTION_TITLE_LIMIT = 1;

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean);
}

function terminalSignature(value: string) {
  return words(value.replace(/[.!?。！？]+$/u, "")).slice(-2).join(" ");
}

export function editorialTitleForm(title: string) {
  const normalized = title.trim();
  if (/[?？]$/u.test(normalized) || /(까요|나요|는가)$/u.test(normalized)) return "question";
  if (/(다면|라면|한다면)$/u.test(normalized)) return "conditional";
  if (/(봅시다|합시다|바랍니다|해주세요)$/u.test(normalized)) return "proposal";
  if (/(습니다|입니다|합니다|않습니다|느낍니다)$/u.test(normalized)) return "statement";
  return "scene";
}

function commentStance(comment: EditorialComment) {
  const match = String(comment.id).match(/(?:^|-)(agree|caution)(?:-|$)/u);
  return match?.[1] ?? null;
}

export function editorialDiversityIssues(
  posts: EditorialPost[],
  commentsForPost: CommentsForPost,
) {
  const issues: string[] = [];
  const postNames = posts.map((post) => String(post.displayName).trim());
  const categories = new Set(posts.map((post) => post.category));
  const titleForms = posts.map((post) => editorialTitleForm(post.title));
  const titleEndings = posts.map((post) => terminalSignature(post.title));
  const bodyEndings = posts.map((post) => terminalSignature(post.content));

  if (new Set(postNames).size !== postNames.length) issues.push("게시글 작성자명이 중복됩니다.");
  if (postNames.some((name) => words(name).length !== 2)) issues.push("게시글 작성자명은 두 단어여야 합니다.");
  if (categories.size < Math.min(4, posts.length)) issues.push("카테고리가 충분히 다양하지 않습니다.");
  if (titleForms.filter((form) => form === "question").length > QUESTION_TITLE_LIMIT) {
    issues.push("질문형 제목은 하루 한 편을 넘을 수 없습니다.");
  }
  if (new Set(titleForms).size < Math.min(4, posts.length)) issues.push("제목 논조가 충분히 다양하지 않습니다.");
  if (new Set(titleEndings).size !== titleEndings.length) issues.push("제목 끝맺음이 반복됩니다.");
  if (new Set(bodyEndings).size !== bodyEndings.length) issues.push("본문 마지막 어조가 반복됩니다.");

  const allCommentNames: string[] = [];
  const allCommentBodies: string[] = [];
  const stanceSequences: string[] = [];

  for (const post of posts) {
    const comments = commentsForPost(post.id);
    if (comments.length !== post.commentCount) issues.push(`${post.id}: 댓글 수가 표시값과 다릅니다.`);

    const stances = comments.map(commentStance);
    const agreeCount = stances.filter((stance) => stance === "agree").length;
    const cautionCount = stances.filter((stance) => stance === "caution").length;
    if (comments.length < 6 || comments.length > 10) issues.push(`${post.id}: 댓글은 6~10개여야 합니다.`);
    if (Math.abs(agreeCount - cautionCount) > 1) issues.push(`${post.id}: 찬반 댓글 수 차이는 한 개 이하여야 합니다.`);
    if (stances.some((stance) => stance === null)) issues.push(`${post.id}: 댓글 관점 표식이 빠졌습니다.`);
    if (comments.some((_, index) => index >= 2
      && stances[index] === stances[index - 1]
      && stances[index] === stances[index - 2])) {
      issues.push(`${post.id}: 같은 관점의 댓글이 세 개 연속됩니다.`);
    }
    stanceSequences.push(stances.join("-"));

    const endingSignatures = comments.map((comment) => terminalSignature(comment.body));
    if (endingSignatures.some((ending, index) => index > 0 && ending === endingSignatures[index - 1])) {
      issues.push(`${post.id}: 인접 댓글의 끝맺음이 반복됩니다.`);
    }

    for (const comment of comments) {
      allCommentNames.push(comment.displayName.trim());
      allCommentBodies.push(comment.body.trim());
      if (words(comment.displayName).length !== 2) issues.push(`${comment.id}: 댓글 작성자명은 두 단어여야 합니다.`);
      if (Date.parse(comment.createdAt) <= Date.parse(post.createdAt)) issues.push(`${comment.id}: 댓글 시간이 게시글보다 빠릅니다.`);
    }
  }

  if (new Set(stanceSequences).size !== stanceSequences.length) issues.push("게시글별 찬반 댓글 배열이 반복됩니다.");
  if (new Set(allCommentNames).size !== allCommentNames.length) issues.push("댓글 작성자명이 중복됩니다.");
  if (new Set(allCommentBodies).size !== allCommentBodies.length) issues.push("댓글 본문이 중복됩니다.");

  return issues;
}

export function assertEditorialDiversity(
  posts: EditorialPost[],
  commentsForPost: CommentsForPost,
) {
  const issues = editorialDiversityIssues(posts, commentsForPost);
  if (issues.length) throw new Error(`편집 다양성 검수 실패:\n${issues.join("\n")}`);
}
