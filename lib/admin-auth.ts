import { db, databaseEnabled, ensureSchema } from "./db";

const PASSWORD_ITERATIONS = 210_000;

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

export async function isAdminRequest(request: Request) {
  const expected = process.env.ADMIN_REVIEW_SECRET;
  const supplied = request.headers.get("x-admin-secret") || "";
  if (!supplied) return false;
  if (expected && timingSafeEqual(expected, supplied)) return true;
  if (!databaseEnabled()) return false;
  await ensureSchema();
  const rows = await db()`SELECT password_salt, password_hash, password_iterations FROM admin_credentials WHERE id = 'owner' LIMIT 1`;
  if (!rows[0]) return false;
  const actual = await derivePasswordHash(supplied, String(rows[0].password_salt), Number(rows[0].password_iterations));
  return timingSafeEqual(String(rows[0].password_hash), actual);
}
