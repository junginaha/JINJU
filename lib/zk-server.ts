import { Group } from "@semaphore-protocol/group";
import { verifyProof, type SemaphoreProof } from "@semaphore-protocol/proof";
import { db, ensureSchema } from "./db";
import { ZK_RETENTION_DAYS, ZK_TREE_DEPTH, zkFieldHash } from "./zk-shared";

const SNARK_SCALAR_FIELD = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const NUMERIC_VALUE = /^\d{1,78}$/;

export type AnonymousProofCheck =
  | { valid: true }
  | { valid: false; reason: "invalid_proof" | "expired_root" | "wrong_action" };

function retentionDate() {
  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + ZK_RETENTION_DAYS);
  return expiresAt;
}

export function validIdentityCommitment(value: unknown): value is string {
  if (typeof value !== "string" || !NUMERIC_VALUE.test(value)) return false;
  const commitment = BigInt(value);
  return commitment > BigInt(0) && commitment < SNARK_SCALAR_FIELD;
}

export async function registerAnonymousMember(commitment: string) {
  await ensureSchema();
  const expiresAt = retentionDate();
  await db()`DELETE FROM zk_members WHERE expires_at <= NOW()`;
  await db()`
    INSERT INTO zk_members (commitment, expires_at)
    VALUES (${commitment}, ${expiresAt.toISOString()})
    ON CONFLICT (commitment)
    DO UPDATE SET expires_at = EXCLUDED.expires_at`;

  const rows = await db()`
    SELECT commitment
    FROM zk_members
    WHERE expires_at > NOW()
    ORDER BY member_index ASC
    LIMIT 1048576`;
  const members = rows.map((row: Record<string, unknown>) => String(row.commitment));
  const group = new Group(members.map(BigInt));
  const root = group.root.toString();

  await db()`
    INSERT INTO zk_group_roots (root, tree_depth, expires_at)
    VALUES (${root}, ${ZK_TREE_DEPTH}, ${expiresAt.toISOString()})
    ON CONFLICT (root)
    DO UPDATE SET expires_at = EXCLUDED.expires_at`;

  return {
    members,
    root,
    treeDepth: ZK_TREE_DEPTH,
    expiresAt: expiresAt.toISOString(),
    anonymitySetSize: members.length,
  };
}

export async function verifyAnonymousAction(
  proof: SemaphoreProof,
  expectedMessage: string,
  expectedScope: string,
): Promise<AnonymousProofCheck> {
  const [message, scope] = await Promise.all([
    zkFieldHash(expectedMessage),
    zkFieldHash(expectedScope),
  ]);
  if (
    proof.merkleTreeDepth !== ZK_TREE_DEPTH
    || proof.message !== message
    || proof.scope !== scope
  ) return { valid: false, reason: "wrong_action" };

  await ensureSchema();
  const roots = await db()`
    SELECT 1
    FROM zk_group_roots
    WHERE root = ${proof.merkleTreeRoot}
      AND tree_depth = ${ZK_TREE_DEPTH}
      AND expires_at > NOW()
    LIMIT 1`;
  if (!roots[0]) return { valid: false, reason: "expired_root" };

  try {
    return await verifyProof(proof)
      ? { valid: true }
      : { valid: false, reason: "invalid_proof" };
  } catch {
    return { valid: false, reason: "invalid_proof" };
  }
}

export function anonymousProofExpiry() {
  return retentionDate().toISOString();
}
