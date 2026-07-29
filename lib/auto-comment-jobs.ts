import * as Sentry from "@sentry/nextjs";
import { ensureAutoComments, type AutoCommentPost } from "./auto-comments";
import { db, ensureSchema } from "./db";

export const AUTO_COMMENT_MAX_ATTEMPTS = 3;
const FAILURE_CODE = "automatic_comment_generation_failed";

type AttemptFailure = {
  attempt: number;
  final: boolean;
  error: unknown;
};

type AttemptOptions = {
  startingAttempt?: number;
  maxAttempts?: number;
  onFailure?: (failure: AttemptFailure) => Promise<void> | void;
};

export async function runAutoCommentAttempts(
  task: (attempt: number) => Promise<void>,
  options: AttemptOptions = {},
) {
  const maxAttempts = options.maxAttempts ?? AUTO_COMMENT_MAX_ATTEMPTS;
  let attempt = options.startingAttempt ?? 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      await task(attempt);
      return { ok: true as const, attempt };
    } catch (error) {
      lastError = error;
      await options.onFailure?.({ attempt, final: attempt >= maxAttempts, error });
    }
  }

  return { ok: false as const, attempt, error: lastError };
}

export async function enqueueAutoCommentJob(postId: string) {
  await ensureSchema();
  await db()`
    INSERT INTO auto_comment_jobs (post_id, status, attempt_count, max_attempts, next_attempt_at)
    VALUES (${postId}, 'pending', 0, ${AUTO_COMMENT_MAX_ATTEMPTS}, NOW())
    ON CONFLICT (post_id) DO NOTHING`;
}

async function claimAutoCommentJob(postId: string) {
  const rows = await db()`
    UPDATE auto_comment_jobs
    SET status = 'running', updated_at = NOW()
    WHERE post_id = ${postId}
      AND attempt_count < max_attempts
      AND (
        status = 'pending'
        OR (status = 'running' AND updated_at <= NOW() - INTERVAL '15 minutes')
      )
    RETURNING attempt_count, max_attempts`;
  if (!rows[0]) return null;
  return {
    attemptCount: Number(rows[0].attempt_count),
    maxAttempts: Number(rows[0].max_attempts),
  };
}

async function publicPost(postId: string): Promise<AutoCommentPost | null> {
  const rows = await db()`
    SELECT id, title, content, category, created_at
    FROM posts
    WHERE id = ${postId} AND status = 'approved' AND visibility = 'public'
    LIMIT 1`;
  if (!rows[0]) return null;
  return {
    id: String(rows[0].id),
    title: String(rows[0].title),
    content: String(rows[0].content),
    category: String(rows[0].category),
    createdAt: new Date(String(rows[0].created_at)).toISOString(),
  };
}

async function reportTerminalFailure(postId: string, attempt: number) {
  Sentry.captureException(new Error("Automatic comment generation failed after retries."), {
    tags: {
      component: "automatic-comments",
      terminal: "true",
    },
    extra: {
      postId,
      attemptCount: attempt,
    },
  });
  await Sentry.flush(2_000).catch(() => false);
}

export async function processAutoCommentJob(postId: string) {
  await ensureSchema();
  const claimed = await claimAutoCommentJob(postId);
  if (!claimed) return { status: "skipped" as const, attempts: 0 };

  const post = await publicPost(postId);
  if (!post) {
    await db()`
      UPDATE auto_comment_jobs
      SET status = 'completed', last_error = 'post_not_public',
          completed_at = NOW(), updated_at = NOW()
      WHERE post_id = ${postId}`;
    return { status: "skipped" as const, attempts: claimed.attemptCount };
  }

  const result = await runAutoCommentAttempts(
    async () => {
      await ensureAutoComments(post);
    },
    {
      startingAttempt: claimed.attemptCount,
      maxAttempts: claimed.maxAttempts,
      onFailure: async ({ attempt, final }) => {
        await db()`
          UPDATE auto_comment_jobs
          SET attempt_count = ${attempt},
              status = ${final ? "failed" : "running"},
              last_error = ${FAILURE_CODE},
              next_attempt_at = NOW(),
              failed_at = ${final ? new Date().toISOString() : null},
              updated_at = NOW()
          WHERE post_id = ${postId}`;
      },
    },
  );

  if (result.ok) {
    await db()`
      UPDATE auto_comment_jobs
      SET status = 'completed', attempt_count = ${result.attempt},
          last_error = '', completed_at = NOW(), failed_at = NULL, updated_at = NOW()
      WHERE post_id = ${postId}`;
    return { status: "completed" as const, attempts: result.attempt };
  }

  await reportTerminalFailure(postId, result.attempt);
  return { status: "failed" as const, attempts: result.attempt };
}

export async function processDueAutoCommentJobs(limit = 10) {
  await ensureSchema();
  const rows = await db()`
    SELECT post_id
    FROM auto_comment_jobs
    WHERE attempt_count < max_attempts
      AND (
        (status = 'pending' AND next_attempt_at <= NOW())
        OR (status = 'running' AND updated_at <= NOW() - INTERVAL '15 minutes')
      )
    ORDER BY created_at ASC
    LIMIT ${limit}`;
  const results = [];
  for (const row of rows) {
    results.push(await processAutoCommentJob(String(row.post_id)));
  }
  return results;
}
