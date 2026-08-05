"use client";

import JinjuApp, { type Post } from "./JinjuApp";

type JinjuAppSafeProps = {
  initialPosts?: Post[];
  initialPostId?: string | null;
};

export default function JinjuAppSafe({ initialPosts, initialPostId = null }: JinjuAppSafeProps) {
  return <JinjuApp initialPosts={initialPosts ?? []} initialPostId={initialPostId} />;
}
