"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SITE_DEFINITION } from "@/lib/search-indexing";
import JinjuApp, { type Post } from "./JinjuApp";

type JinjuAppBridgeProps = {
  initialPosts?: Post[];
  initialPostId?: string | null;
  initialTotal?: number;
};

type FeedPagerState = {
  total: number;
  shown: number;
};

const FEED_ACCESSIBLE_NAME = "진주 익명 의견 게시판";
const COMPOSER_TITLE = "익명 의견 남기기";
const COMPOSER_SUBTITLE = "안전하게 속마음을 들려주세요.";
const BODY_PLACEHOLDER = "무슨 일이 있었는지 천천히 들려주세요.\n편한 마음으로 적으셔도 괜찮아요.";
const WRITE_BUTTON_LABELS = ["새 의견 쓰기", "나의 의견", "의견 쓰기", "의견 남기기"];
const FEED_PAGE_SIZE = 30;

const feedPagerCss = `
.feed-pager-slot {
  width: 100%;
  margin: 16px 0 30px;
  padding: 0 2px;
}
.feed-more-button {
  display: grid;
  width: 100%;
  min-height: 58px;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 8px 12px 8px 18px;
  color: #f2f2f2;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(180deg, #202020 0%, #191919 100%);
  border: 1px solid #373737;
  border-radius: 18px;
  box-shadow: 0 12px 30px #00000026, inset 0 1px 0 #ffffff0a;
  transition: transform .16s ease, border-color .16s ease, background .16s ease;
}
.feed-more-button:hover {
  background: linear-gradient(180deg, #252525 0%, #1d1d1d 100%);
  border-color: #4a4a4a;
  transform: translateY(-1px);
}
.feed-more-button:active { transform: scale(.995); }
.feed-more-button:focus-visible { outline: 2px solid #f2f2f2; outline-offset: 3px; }
.feed-more-label {
  overflow: hidden;
  font-size: 15px;
  font-weight: 680;
  letter-spacing: -.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-more-progress {
  color: #8f8f8f;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -.01em;
  white-space: nowrap;
}
.feed-more-arrow {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: #151515;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  background: #eeeae3;
  border-radius: 999px;
  transition: transform .16s ease;
}
.feed-more-button:hover .feed-more-arrow { transform: translateY(2px); }
@media (max-width: 640px) {
  .feed-pager-slot { margin: 14px 0 24px; padding: 0; }
  .feed-more-button { min-height: 56px; padding-left: 16px; border-radius: 16px; }
  .feed-more-label { font-size: 14px; }
  .feed-more-arrow { width: 28px; height: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  .feed-more-button,
  .feed-more-arrow { transition: none; }
}
`;

function FeedPagerPortal() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [pager, setPager] = useState<FeedPagerState>({ total: 0, shown: 0 });
  const visibleLimitRef = useRef(FEED_PAGE_SIZE);
  const signatureRef = useRef("");

  useEffect(() => {
    let observer: MutationObserver | null = null;
    let frame = 0;
    let ownedMount: HTMLElement | null = null;

    const sync = () => {
      const feedShell = document.querySelector<HTMLElement>(".feed-shell");
      if (!feedShell) {
        setPager((current) => current.total === 0 && current.shown === 0 ? current : { total: 0, shown: 0 });
        if (mount && !mount.isConnected) setMount(null);
        return;
      }

      const cards = Array.from(feedShell.querySelectorAll<HTMLElement>(".post-feed .feed-post"));
      const signature = cards
        .map((card) => card.querySelector<HTMLAnchorElement>(".post-main-link")?.getAttribute("href") || "")
        .join("|");

      if (signature !== signatureRef.current) {
        visibleLimitRef.current = FEED_PAGE_SIZE;
        signatureRef.current = signature;
      }

      const shown = Math.min(visibleLimitRef.current, cards.length);
      cards.forEach((card, index) => {
        card.hidden = index >= shown;
      });

      const continuedFeed = feedShell.querySelector<HTMLElement>(".continued-feed");
      let nextMount = document.getElementById("jinju-feed-pager") as HTMLElement | null;
      if (!nextMount && continuedFeed?.parentElement) {
        nextMount = document.createElement("div");
        nextMount.id = "jinju-feed-pager";
        nextMount.className = "feed-pager-slot";
        continuedFeed.insertAdjacentElement("afterend", nextMount);
        ownedMount = nextMount;
      }
      if (nextMount !== mount) setMount(nextMount);

      setPager((current) => current.total === cards.length && current.shown === shown
        ? current
        : { total: cards.length, shown });
    };

    const scheduleSync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };

    observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });
    scheduleSync();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      if (ownedMount?.isConnected) ownedMount.remove();
    };
  }, [mount]);

  if (!mount || pager.total <= pager.shown) return null;

  const nextCount = Math.min(FEED_PAGE_SIZE, pager.total - pager.shown);

  const showMore = () => {
    const feedShell = document.querySelector<HTMLElement>(".feed-shell");
    if (!feedShell) return;
    const cards = Array.from(feedShell.querySelectorAll<HTMLElement>(".post-feed .feed-post"));
    const nextShown = Math.min(visibleLimitRef.current + FEED_PAGE_SIZE, cards.length);
    visibleLimitRef.current = nextShown;
    cards.forEach((card, index) => {
      card.hidden = index >= nextShown;
    });
    setPager({ total: cards.length, shown: nextShown });
  };

  return createPortal(
    <button
      className="feed-more-button"
      type="button"
      onClick={showMore}
      aria-label={`의견 ${nextCount}개 더 보기. 현재 ${pager.shown}개 표시 중`}
    >
      <span className="feed-more-label">더 보기</span>
      <span className="feed-more-progress" aria-hidden="true">{pager.shown} / {pager.total}</span>
      <span className="feed-more-arrow" aria-hidden="true">↓</span>
    </button>,
    mount,
  );
}

/**
 * Thin compatibility boundary around the legacy JinjuApp monolith.
 * Keep only presentation synchronization that cannot yet be expressed through props.
 * Business rules and feature logic must stay out of this file.
 */
export default function JinjuAppBridge({ initialPosts, initialPostId = null, initialTotal }: JinjuAppBridgeProps) {
  const totalRef = useRef(Math.max(0, initialTotal ?? initialPosts?.length ?? 0));

  useEffect(() => {
    let active = true;
    let refreshing = false;
    let countTarget: HTMLElement | null = null;
    let countObserver: MutationObserver | null = null;
    const frames = new Set<number>();

    totalRef.current = Math.max(0, initialTotal ?? initialPosts?.length ?? 0);

    function expectedCountText() {
      return `${totalRef.current}개의 공개 의견`;
    }

    async function refreshTotal() {
      if (refreshing) return;
      refreshing = true;
      try {
        const response = await fetch("/api/posts", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { total?: number };
        if (!active || !Number.isFinite(data.total)) return;
        totalRef.current = Math.max(0, Number(data.total));
        applyTotal();
      } finally {
        refreshing = false;
      }
    }

    function bindCountTarget() {
      const nextTarget = document.querySelector<HTMLElement>(".feed-heading > span");
      if (nextTarget === countTarget) return countTarget;

      countObserver?.disconnect();
      countObserver = null;
      countTarget = nextTarget;

      if (countTarget) {
        const observedTarget = countTarget;
        countObserver = new MutationObserver(() => {
          if (observedTarget.textContent !== expectedCountText()) void refreshTotal();
        });
        countObserver.observe(observedTarget, { childList: true, characterData: true, subtree: true });
      }
      return countTarget;
    }

    function applyTotal() {
      const target = bindCountTarget();
      if (target && target.textContent !== expectedCountText()) target.textContent = expectedCountText();
    }

    function ensureTermsLink(footer: HTMLElement) {
      if (footer.querySelector('a[href="/terms"]')) return;
      const termsLink = document.createElement("a");
      termsLink.href = "/terms";
      termsLink.textContent = "이용약관";
      const contact = footer.querySelector('a[href^="mailto:"]');
      const footerCopy = footer.querySelector("p");
      footer.insertBefore(termsLink, contact || footerCopy || null);
    }

    function applyFeedPresentation() {
      const heading = document.querySelector<HTMLElement>(".feed-heading");
      if (!heading) return false;

      const main = document.querySelector<HTMLElement>(".chat-main#feed");
      main?.setAttribute("aria-label", FEED_ACCESSIBLE_NAME);

      const title = heading.querySelector<HTMLElement>("h1");
      if (title) {
        title.textContent = FEED_ACCESSIBLE_NAME;
        title.hidden = true;
        title.removeAttribute("style");
      }

      const footer = document.querySelector<HTMLElement>(".sidebar-footer");
      if (footer) {
        const footerCopy = footer.querySelector<HTMLElement>("p");
        if (footerCopy && footerCopy.textContent !== SITE_DEFINITION) footerCopy.textContent = SITE_DEFINITION;
        ensureTermsLink(footer);
      }

      applyTotal();
      return true;
    }

    function applyComposerPresentation() {
      const intro = document.querySelector<HTMLElement>(".composer-intro");
      if (!intro) return false;

      const eyebrow = intro.querySelector<HTMLElement>(".eyebrow");
      if (eyebrow) eyebrow.hidden = true;

      const title = intro.querySelector<HTMLElement>("#write-title");
      if (title && title.textContent !== COMPOSER_TITLE) title.textContent = COMPOSER_TITLE;

      const paragraphs = intro.querySelectorAll<HTMLElement>("p");
      const subtitle = paragraphs[paragraphs.length - 1];
      if (subtitle && subtitle.textContent !== COMPOSER_SUBTITLE) subtitle.textContent = COMPOSER_SUBTITLE;

      const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="의견 본문"]');
      if (textarea && textarea.placeholder !== BODY_PLACEHOLDER) textarea.placeholder = BODY_PLACEHOLDER;
      return true;
    }

    function schedule(action: () => boolean | void, retryOnce = false) {
      const first = requestAnimationFrame(() => {
        frames.delete(first);
        if (!active) return;
        const applied = action();
        if (!retryOnce || applied !== false) return;
        const second = requestAnimationFrame(() => {
          frames.delete(second);
          if (active) action();
        });
        frames.add(second);
      });
      frames.add(first);
    }

    function syncFeed() {
      const ready = applyFeedPresentation();
      if (ready) void refreshTotal();
      return ready;
    }

    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (target.closest(".detail-home")) schedule(syncFeed, true);

      const button = target.closest("button");
      if (!button) return;
      const label = button.textContent?.replace(/\s+/g, " ").trim() || "";
      if (WRITE_BUTTON_LABELS.some((item) => label.includes(item))) schedule(applyComposerPresentation, true);
    }

    function handlePopState() {
      schedule(syncFeed, true);
    }

    syncFeed();
    applyComposerPresentation();
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      active = false;
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      countObserver?.disconnect();
      frames.forEach((frame) => cancelAnimationFrame(frame));
      frames.clear();
    };
  }, [initialPostId, initialPosts?.length, initialTotal]);

  return (
    <>
      <style>{feedPagerCss}</style>
      <JinjuApp initialPosts={initialPosts ?? []} initialPostId={initialPostId} />
      <FeedPagerPortal />
    </>
  );
}
