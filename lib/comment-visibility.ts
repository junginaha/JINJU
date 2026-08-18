import { newPostAutoCommentTarget } from "./community-settings";

export type CommentWithBody = { body: string };

export function normalizedCommentBody(body: string) {
  return body.trim().replace(/\s+/g, " ");
}

export function hasCompleteAutoCommentSet(autoCommentCount: number, postId = "") {
  return autoCommentCount >= newPostAutoCommentTarget(postId);
}

export function mergeBaseCommentsByBody<T extends CommentWithBody>(...sources: T[][]): T[] {
  const byBody = new Map<string, T>();
  for (const source of sources) {
    for (const comment of source) {
      const key = normalizedCommentBody(comment.body);
      if (!byBody.has(key)) byBody.set(key, comment);
    }
  }
  return [...byBody.values()];
}

export function combineBaseAndStoredComments<T extends CommentWithBody>(base: T[], stored: T[]) {
  const storedBodies = new Set(stored.map((comment) => normalizedCommentBody(comment.body)));
  return [...base.filter((comment) => !storedBodies.has(normalizedCommentBody(comment.body))), ...stored];
}

export function visibleBaseCommentCount<T extends CommentWithBody>(base: T[], storedBodies: string[]) {
  const stored = new Set(storedBodies.map(normalizedCommentBody));
  return base.filter((comment) => !stored.has(normalizedCommentBody(comment.body))).length;
}
