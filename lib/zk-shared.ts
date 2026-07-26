import type { SemaphoreProof } from "@semaphore-protocol/proof";

export const ZK_TREE_DEPTH = 20;
export const ZK_RETENTION_DAYS = 30;
export const ZK_ARTIFACT_VERSION = "4.13.0";

export function reactionProofMessage(postId: string, kind: "heard" | "same") {
  return `jinju:reaction:${postId}:${kind}`;
}

export function reactionProofScope(postId: string) {
  return `jinju:reaction:${postId}`;
}

export async function zkFieldHash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  const hexadecimal = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return (BigInt(`0x${hexadecimal}`) >> BigInt(8)).toString();
}

export function parseSemaphoreProof(value: unknown): SemaphoreProof | null {
  if (!value || typeof value !== "object") return null;
  const proof = value as Partial<SemaphoreProof>;
  if (
    typeof proof.merkleTreeDepth !== "number"
    || typeof proof.merkleTreeRoot !== "string"
    || typeof proof.message !== "string"
    || typeof proof.nullifier !== "string"
    || typeof proof.scope !== "string"
    || !Array.isArray(proof.points)
    || !proof.points.every((point) => typeof point === "string")
  ) return null;
  return proof as SemaphoreProof;
}
