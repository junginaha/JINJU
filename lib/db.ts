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
      await sql`CREATE INDEX IF NOT EXISTS posts_status_created_idx ON posts(status, created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS comments_post_created_idx ON comments(post_id, created_at ASC)`;
      await sql`UPDATE posts SET status = 'hidden', updated_at = NOW() WHERE id = 'unused-subscriptions'`;
      await sql`UPDATE comments SET status = 'hidden' WHERE post_id = 'unused-subscriptions'`;
      await sql`UPDATE posts SET status = 'deleted', updated_at = NOW() WHERE id = '53446x5m240c181m1n5c'`;
      await sql`UPDATE comments SET status = 'hidden' WHERE post_id = '53446x5m240c181m1n5c'`;
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
