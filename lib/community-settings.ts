export const NEW_POST_COMMUNITY_DEFAULTS = {
  likesMin: 20,
  likesMax: 33,
  immediateComments: 3,
  autoCommentMin: 9,
  autoCommentMax: 11,
  followupOffsetsMinutes: [9, 24, 51, 103, 192, 318, 497, 731],
} as const;

function stableNumber(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function newPostInitialLikes(randomValue = Math.random()) {
  const normalized = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 0.9999999999999999)
    : 0;
  const range =
    NEW_POST_COMMUNITY_DEFAULTS.likesMax
    - NEW_POST_COMMUNITY_DEFAULTS.likesMin
    + 1;
  return NEW_POST_COMMUNITY_DEFAULTS.likesMin + Math.floor(normalized * range);
}

export const AUTO_COMMENT_TOTAL = 10;

export function newPostAutoCommentTarget(postId = "") {
  if (!postId) return AUTO_COMMENT_TOTAL;
  const range = NEW_POST_COMMUNITY_DEFAULTS.autoCommentMax
    - NEW_POST_COMMUNITY_DEFAULTS.autoCommentMin
    + 1;
  return NEW_POST_COMMUNITY_DEFAULTS.autoCommentMin
    + stableNumber(`${postId}:auto-comment-target`) % range;
}

export function newPostCommentSchedule(postCreatedAt: string, postId = "") {
  const parsed = Date.parse(postCreatedAt);
  const postTime = Number.isFinite(parsed) ? parsed : Date.now();
  const targetCount = newPostAutoCommentTarget(postId);
  const immediate = Array.from(
    { length: NEW_POST_COMMUNITY_DEFAULTS.immediateComments },
    (_, index) => new Date(postTime + index * 1_000).toISOString(),
  );
  const followups = NEW_POST_COMMUNITY_DEFAULTS.followupOffsetsMinutes
    .slice(0, targetCount - immediate.length)
    .map((minutes, index) => {
      const jitterMinutes = postId
        ? stableNumber(`${postId}:auto-comment-delay:${index}`) % 7 - 3
        : 0;
      return new Date(postTime + (minutes + jitterMinutes) * 60_000).toISOString();
    });
  return [...immediate, ...followups];
}

export const REACTION_SETTINGS = {
  anonymousCookieName: "jinju_reaction_id",
  retentionDays: 30,
} as const;
