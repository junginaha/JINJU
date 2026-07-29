import { REACTION_SETTINGS } from "./community-settings";

export type ReactionKind = "heard" | "same";
export type ReactionRecord = { kind: ReactionKind; expiresAt: number };
export type ReactionHistory = Record<string, ReactionRecord>;

export const REACTION_HISTORY_KEY = "jinju-reacted-posts-v3";

export function activeReactionHistory(stored: unknown, now = Date.now()): ReactionHistory {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
  return Object.fromEntries(
    Object.entries(stored).filter((entry): entry is [string, ReactionRecord] => {
      const record = entry[1] as Partial<ReactionRecord> | null;
      return Boolean(record)
        && (record?.kind === "heard" || record?.kind === "same")
        && Number.isFinite(record.expiresAt)
        && Number(record.expiresAt) > now;
    }),
  );
}

export function recordReaction(
  history: ReactionHistory,
  postId: string,
  kind: ReactionKind,
  now = Date.now(),
): ReactionHistory {
  return {
    ...activeReactionHistory(history, now),
    [postId]: {
      kind,
      expiresAt: now + REACTION_SETTINGS.retentionDays * 24 * 60 * 60_000,
    },
  };
}
