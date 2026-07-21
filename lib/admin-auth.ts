import { db, databaseEnabled, ensureSchema, hash, token } from "./db";

const PASSWORD_ITERATIONS = 210_000;
export const ADMIN_SESSION_COOKIE = "__Host-jinju-admin";
const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;

export function timingSafeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

async function derivePasswordHash(password: string, salt: string, iterations: number) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(salt), iterations }, material, 256);
  return bytesToHex(new Uint8Array(bits));
}

export async function createAdminCredential(password: string) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(24));
  const salt = bytesToHex(saltBytes);
  return { salt, passwordHash: await derivePasswordHash(password, salt, PASSWORD_ITERATIONS), iterations: PASSWORD_ITERATIONS };
}

export type AdminIdentity = { id: string; role: "admin" | "superadmin" };

export async function authenticateAdminCredential(usernameInput: string, password: string): Promise<AdminIdentity | null> {
  const expected = process.env.ADMIN_REVIEW_SECRET;
  const username = usernameInput.trim().toLowerCase();
  if (!password) return null;
  if (expected && username === "owner" && timingSafeEqual(expected, password)) return { id: "owner", role: "admin" };
  if (!/^[a-z0-9_-]{1,64}$/.test(username)) return null;
  if (!databaseEnabled()) return null;
  await ensureSchema();
  const rows = await db()`SELECT password_salt, password_hash, password_iterations, role FROM admin_credentials WHERE id = ${username} LIMIT 1`;
  if (!rows[0]) return null;
  const actual = await derivePasswordHash(password, String(rows[0].password_salt), Number(rows[0].password_iterations));
  if (!timingSafeEqual(String(rows[0].password_hash), actual)) return null;
  return { id: username, role: String(rows[0].role) === "superadmin" ? "superadmin" : "admin" };
}

function cookieValue(request: Request, name: string) {
  const cookies = request.headers.get("cookie") || "";
  return cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

export async function createAdminSession(identity: AdminIdentity) {
  await ensureSchema();
  const sessionToken = token(24);
  await db()`DELETE FROM admin_sessions WHERE expires_at <= NOW()`;
  await db()`
    INSERT INTO admin_sessions (token_hash, admin_id, expires_at)
    VALUES (${await hash(sessionToken)}, ${identity.id}, NOW() + INTERVAL '8 hours')`;
  return {
    sessionToken,
    cookie: `${ADMIN_SESSION_COOKIE}=${sessionToken}; Path=/; Max-Age=${ADMIN_SESSION_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
  };
}

export async function deleteAdminSession(request: Request) {
  const sessionToken = cookieValue(request, ADMIN_SESSION_COOKIE);
  if (sessionToken && databaseEnabled()) {
    await ensureSchema();
    await db()`DELETE FROM admin_sessions WHERE token_hash = ${await hash(sessionToken)}`;
  }
}

export function clearAdminSessionCookie() {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export async function getAdminIdentity(request: Request): Promise<AdminIdentity | null> {
  const sessionToken = cookieValue(request, ADMIN_SESSION_COOKIE);
  if (!sessionToken || !databaseEnabled()) return null;
  await ensureSchema();
  const rows = await db()`
    SELECT session.admin_id, credential.role
    FROM admin_sessions AS session
    LEFT JOIN admin_credentials AS credential ON credential.id = session.admin_id
    WHERE session.token_hash = ${await hash(sessionToken)} AND session.expires_at > NOW()
    LIMIT 1`;
  if (!rows[0]) return null;
  const id = String(rows[0].admin_id);
  const role = id === "owner" ? "admin" : String(rows[0].role) === "superadmin" ? "superadmin" : "admin";
  return { id, role };
}

export function hasValidMutationOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}

export async function isAdminRequest(request: Request) {
  return Boolean(await getAdminIdentity(request));
}
