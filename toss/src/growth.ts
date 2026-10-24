/*
 * 진주 mini app — usage events and review timing (Toss bundle only).
 *  - Analytics events feed the console's key metrics (전환 지표).
 *    Main conversion: post_publish. Supporting: comment_submit, reaction, share.
 *  - Review.request is called right after a core task succeeds (a post or a comment is up),
 *    at most once per app session and once every 30 days from this device.
 *    The flow never depends on whether the review sheet appears.
 *  - The intro plays on the first launch of the day; later launches that day open straight to the feed.
 */
import { Analytics, Review } from "@apps-in-toss/web-framework";

type Params = Record<string, string | number | boolean | null | undefined>;

const INTRO_KEY = "jinju-intro-seen-v1";
const INTRO_DAY_KEY = "jinju-toss-intro-day";
const REVIEW_KEY = "jinju-toss-review-at";
const REVIEW_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const REVIEW_DELAY_MS = 1600;

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

function safe(fn: () => unknown) {
  try {
    const r = fn();
    if (r && typeof (r as Promise<unknown>).catch === "function") (r as Promise<unknown>).catch(() => {});
  } catch {}
}

// Intro: once per day inside Toss.
try {
  const forced = new URLSearchParams(location.search).get("intro") === "1";
  if (!forced) {
    if (localStorage.getItem(INTRO_DAY_KEY) === today()) sessionStorage.setItem(INTRO_KEY, "seen");
    else localStorage.setItem(INTRO_DAY_KEY, today());
  }
} catch {}

let reviewAskedThisSession = false;
function askReview(reason: string) {
  if (reviewAskedThisSession) return;
  try {
    const last = Number(localStorage.getItem(REVIEW_KEY) || 0);
    if (last && Date.now() - last < REVIEW_COOLDOWN_MS) return;
  } catch {}
  if (!Review?.request?.isSupported?.()) return;
  reviewAskedThisSession = true;
  window.setTimeout(() => {
    try { localStorage.setItem(REVIEW_KEY, String(Date.now())); } catch {}
    safe(() => Review.request());
    log("review_request", { reason });
  }, REVIEW_DELAY_MS);
}

function log(name: string, params: Params = {}) {
  safe(() => Analytics.log({ log_name: name, log_type: "event", params }));
}

export function screen(name: string, params: Params = {}) {
  safe(() => Analytics.screen({ log_name: name, ...params }));
}

export function track(name: string, params: Params = {}) {
  log(name, params);
  if (name === "post_publish" || name === "comment_submit") askReview(name);
}

(window as unknown as { __jinjuTrack: typeof track }).__jinjuTrack = track;
