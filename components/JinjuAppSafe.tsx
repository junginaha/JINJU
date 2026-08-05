"use client";

import { useEffect } from "react";
import JinjuApp, { type Post } from "./JinjuApp";

type JinjuAppSafeProps = {
  initialPosts?: Post[];
  initialPostId?: string | null;
  initialTotal?: number;
};

export default function JinjuAppSafe({ initialPosts, initialPostId = null, initialTotal }: JinjuAppSafeProps) {
  useEffect(() => {
    if (initialPostId) return;
    let active = true;
    let total = Math.max(0, initialTotal ?? initialPosts?.length ?? 0);
    let target: HTMLElement | null = null;
    let observer: MutationObserver | null = null;
    let refreshing = false;

    const expectedText = () => `${total}개의 공개 의견`;
    const applyTotal = () => {
      target ||= document.querySelector<HTMLElement>(".feed-heading > span");
      if (target && target.textContent !== expectedText()) target.textContent = expectedText();
    };

    const refreshTotal = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const response = await fetch("/api/posts", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { total?: number };
        if (!active || !Number.isFinite(data.total)) return;
        total = Math.max(0, Number(data.total));
        applyTotal();
      } finally {
        refreshing = false;
      }
    };

    const frame = requestAnimationFrame(() => {
      applyTotal();
      if (!target) return;
      observer = new MutationObserver(() => {
        if (target?.textContent !== expectedText()) void refreshTotal();
      });
      observer.observe(target, { childList: true, characterData: true, subtree: true });
      void refreshTotal();
    });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [initialPostId, initialPosts?.length, initialTotal]);

  return <JinjuApp initialPosts={initialPosts ?? []} initialPostId={initialPostId} />;
}
