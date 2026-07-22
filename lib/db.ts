import { neon } from "@neondatabase/serverless";

let schemaReady: Promise<void> | null = null;

export function databaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = db();
      await sql`
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          mode TEXT NOT NULL DEFAULT '털어놓기',
          visibility TEXT NOT NULL DEFAULT 'public',
          risk_level TEXT NOT NULL DEFAULT 'low',
          status TEXT NOT NULL DEFAULT 'approved',
          display_name TEXT NOT NULL DEFAULT '익명',
          delete_key_hash TEXT NOT NULL,
          heard INTEGER NOT NULL DEFAULT 0,
          same INTEGER NOT NULL DEFAULT 0,
          support INTEGER NOT NULL DEFAULT 0,
          comment_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS comments (
          id TEXT PRIMARY KEY,
          post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          display_name TEXT NOT NULL DEFAULT '익명',
          status TEXT NOT NULL DEFAULT 'approved',
          delete_key_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS post_reactions (
          post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          voter_hash TEXT NOT NULL,
          kind TEXT NOT NULL CHECK (kind IN ('heard', 'same')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (post_id, voter_hash)
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS admin_credentials (
          id TEXT PRIMARY KEY,
          password_salt TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          password_iterations INTEGER NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`;
      await sql`ALTER TABLE admin_credentials ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'`;
      await sql`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          token_hash TEXT PRIMARY KEY,
          admin_id TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS rate_limits (
          scope TEXT NOT NULL,
          actor_hash TEXT NOT NULL,
          window_start BIGINT NOT NULL,
          request_count INTEGER NOT NULL DEFAULT 1,
          expires_at TIMESTAMPTZ NOT NULL,
          PRIMARY KEY (scope, actor_hash, window_start)
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS feedback_reports (
          receipt TEXT PRIMARY KEY,
          post_id TEXT NOT NULL,
          reason TEXT NOT NULL,
          detail TEXT NOT NULL DEFAULT '',
          check_key_hash TEXT NOT NULL,
          reporter_hash TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'received',
          auto_blinded BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS admin_content_overrides (
          kind TEXT NOT NULL CHECK (kind IN ('post', 'comment')),
          id TEXT NOT NULL,
          post_id TEXT NOT NULL DEFAULT '',
          title TEXT,
          content TEXT,
          category TEXT,
          display_name TEXT,
          hidden BOOLEAN NOT NULL DEFAULT FALSE,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (kind, id)
        )`;
      await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_issues TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '익명'`;
      await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_explanation TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS review_source TEXT NOT NULL DEFAULT 'rules'`;
      await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`;
      await sql`CREATE INDEX IF NOT EXISTS posts_status_created_idx ON posts(status, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS comments_post_created_idx ON comments(post_id, created_at ASC)`;
      await sql`CREATE INDEX IF NOT EXISTS post_reactions_created_idx ON post_reactions(created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS admin_content_overrides_post_idx ON admin_content_overrides(post_id, kind)`;
      await sql`CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions(expires_at)`;
      await sql`CREATE INDEX IF NOT EXISTS rate_limits_expiry_idx ON rate_limits(expires_at)`;
      await sql`CREATE INDEX IF NOT EXISTS feedback_reports_post_created_idx ON feedback_reports(post_id, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS feedback_reports_expiry_idx ON feedback_reports(expires_at)`;
      await sql`
        UPDATE posts AS post
        SET comment_count = (
          SELECT COUNT(*)::INTEGER
          FROM comments AS comment
          WHERE comment.post_id = post.id AND comment.status = 'approved'
        )
        WHERE post.comment_count <> (
          SELECT COUNT(*)::INTEGER
          FROM comments AS comment
          WHERE comment.post_id = post.id AND comment.status = 'approved'
        )`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

export function token(length = 18) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, length * 2);
}

export async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
