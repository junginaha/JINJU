"use client";

import type { SemaphoreProof } from "@semaphore-protocol/proof";
import {
  ZK_ARTIFACT_VERSION,
  ZK_TREE_DEPTH,
  zkFieldHash,
} from "./zk-shared";

type StoredAnonymousIdentity = {
  privateKey: string;
  members?: string[];
  membershipExpiresAt?: string;
};

const DATABASE_NAME = "jinju-private-identity";
const STORE_NAME = "identity";
const RECORD_KEY = "semaphore-v1";
const ARTIFACT_BASE = `/api/zk/artifacts/${ZK_ARTIFACT_VERSION}`;

let memoryIdentity: StoredAnonymousIdentity | null = null;
let proofQueue: Promise<unknown> = Promise.resolve();

function openIdentityDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("indexeddb_unavailable"));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("identity_database_failed"));
  });
}

async function readIdentityRecord() {
  if (memoryIdentity) return memoryIdentity;
  try {
    const database = await openIdentityDatabase();
    const value = await new Promise<StoredAnonymousIdentity | undefined>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(RECORD_KEY);
      request.onsuccess = () => resolve(request.result as StoredAnonymousIdentity | undefined);
      request.onerror = () => reject(request.error);
    });
    database.close();
    memoryIdentity = value || null;
  } catch {
    memoryIdentity = null;
  }
  return memoryIdentity;
}

async function writeIdentityRecord(record: StoredAnonymousIdentity) {
  memoryIdentity = record;
  try {
    const database = await openIdentityDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(record, RECORD_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  } catch {
    // The in-memory identity still supports the current private-browsing session.
  }
}

async function createProof(message: string, scope: string): Promise<SemaphoreProof> {
  const [{ Identity }, { Group }, { generateProof }] = await Promise.all([
    import("@semaphore-protocol/identity"),
    import("@semaphore-protocol/group"),
    import("@semaphore-protocol/proof"),
  ]);

  let record = await readIdentityRecord();
  let identity;
  try {
    identity = record?.privateKey ? Identity.import(record.privateKey) : new Identity();
  } catch {
    record = null;
    identity = new Identity();
  }
  if (!record) {
    record = { privateKey: identity.export() };
    await writeIdentityRecord(record);
  }

  const cachedUntil = Date.parse(record.membershipExpiresAt || "");
  const cachedMembers = record.members || [];
  const hasCurrentMembership = cachedUntil > Date.now() + 5 * 60_000
    && cachedMembers.includes(identity.commitment.toString());

  if (!hasCurrentMembership) {
    const response = await fetch("/api/zk/membership", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ commitment: identity.commitment.toString() }),
    });
    const data = await response.json() as {
      error?: string;
      members?: string[];
      expiresAt?: string;
    };
    if (!response.ok || !data.members?.length || !data.expiresAt) {
      throw new Error(data.error || "익명 이용 증명을 준비하지 못했습니다.");
    }
    record = {
      ...record,
      members: data.members,
      membershipExpiresAt: data.expiresAt,
    };
    await writeIdentityRecord(record);
  }

  const group = new Group((record.members || []).map(BigInt));
  if (group.indexOf(identity.commitment) < 0) {
    throw new Error("익명 이용 자격을 확인하지 못했습니다.");
  }
  const [proofMessage, proofScope] = await Promise.all([
    zkFieldHash(message),
    zkFieldHash(scope),
  ]);

  return generateProof(
    identity,
    group,
    proofMessage,
    proofScope,
    ZK_TREE_DEPTH,
    {
      wasm: `${ARTIFACT_BASE}/semaphore-${ZK_TREE_DEPTH}.wasm`,
      zkey: `${ARTIFACT_BASE}/semaphore-${ZK_TREE_DEPTH}.zkey`,
    },
  );
}

export function createAnonymousProof(message: string, scope: string) {
  const queued = proofQueue.then(() => createProof(message, scope));
  proofQueue = queued.then(() => undefined, () => undefined);
  return queued;
}

export async function resetAnonymousMembership() {
  const record = await readIdentityRecord();
  if (!record) return;
  await writeIdentityRecord({
    privateKey: record.privateKey,
  });
}
