export type TimedComment = {
  id: string | number;
  createdAt: string;
};

const SEOUL_TIME_ZONE = "Asia/Seoul";
const MINIMUM_COMMENT_GAP_MS = 60_000;

function parsedTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function stableGap(commentId: string | number) {
  const text = String(commentId);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  return (3 + hash % 8) * MINIMUM_COMMENT_GAP_MS;
}

/**
 * Keeps comments chronological and guarantees that no public comment appears
 * before its post. Valid timestamps are preserved whenever possible.
 */
export function normalizeCommentTimes<T extends TimedComment>(postCreatedAt: string, comments: T[], now = Date.now()): T[] {
  const parsedPostTime = parsedTime(postCreatedAt);
  const postTime = parsedPostTime ?? Math.min(now, Date.now());
  const latestAllowed = Math.max(postTime + comments.length, now);

  const ordered = comments
    .map((comment, index) => ({ comment, index, timestamp: parsedTime(comment.createdAt) }))
    .sort((left, right) => {
      if (left.timestamp === null && right.timestamp === null) return left.index - right.index;
      if (left.timestamp === null) return 1;
      if (right.timestamp === null) return -1;
      return left.timestamp - right.timestamp || left.index - right.index;
    });

  let cursor = postTime;
  return ordered.map(({ comment, timestamp }, index) => {
    const remaining = ordered.length - index - 1;
    const upperBound = latestAllowed - remaining;
    const preferred = timestamp !== null && timestamp > cursor ? timestamp : cursor + stableGap(comment.id);
    const corrected = Math.max(cursor + 1, Math.min(preferred, upperBound));
    cursor = corrected;
    return corrected === timestamp ? comment : { ...comment, createdAt: new Date(corrected).toISOString() };
  });
}

export function formatCommentTime(value: string) {
  const timestamp = parsedTime(value);
  if (timestamp === null) return "시간 확인 중";
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(timestamp));
  return parts.map((part) => {
    if (part.type !== "dayPeriod") return part.value;
    return part.value === "AM" ? "오전" : part.value === "PM" ? "오후" : part.value;
  }).join("");
}
