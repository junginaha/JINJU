export function normalizeCommentForDedup(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/\s+/g, " ")
    .trim();
}

export function isDuplicateComment(candidate: string, existing: string[]) {
  const normalized = normalizeCommentForDedup(candidate);
  if (normalized.length < 8) return false;
  return existing.some((item) => normalizeCommentForDedup(item) === normalized);
}
