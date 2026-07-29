export const NEW_POST_COMMUNITY_DEFAULTS = {
  likesMin: 20,
  likesMax: 33,
  immediateComments: 3,
  hourlyComments: 12,
  hourlyIntervalMs: 60 * 60_000,
} as const;

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

export const AUTO_COMMENT_TOTAL =
  NEW_POST_COMMUNITY_DEFAULTS.immediateComments
  + NEW_POST_COMMUNITY_DEFAULTS.hourlyComments;

export function newPostCommentSchedule(postCreatedAt: string) {
  const parsed = Date.parse(postCreatedAt);
  const postTime = Number.isFinite(parsed) ? parsed : Date.now();
  const immediate = Array.from(
    { length: NEW_POST_COMMUNITY_DEFAULTS.immediateComments },
    (_, index) => new Date(postTime + index * 1_000).toISOString(),
  );
  const hourly = Array.from(
    { length: NEW_POST_COMMUNITY_DEFAULTS.hourlyComments },
    (_, index) => new Date(
      postTime + (index + 1) * NEW_POST_COMMUNITY_DEFAULTS.hourlyIntervalMs,
    ).toISOString(),
  );
  return [...immediate, ...hourly];
}

export const REACTION_SETTINGS = {
  anonymousCookieName: "jinju_reaction_id",
  retentionDays: 30,
} as const;
