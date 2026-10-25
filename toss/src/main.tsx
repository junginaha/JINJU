import "./bridge";
import { screen, track } from "./growth";
import { PEARL_ENTRY_PARAM, PEARL_ENTRY_VALUE, pearlEntryStyle } from "@/lib/pearl-entry";
import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import TossShareBridge, { shareJinjuPost } from "./TossShareBridge";
import JinjuAppBridge from "@/components/JinjuAppBridge";
import type { Post } from "@/components/JinjuApp";
import AboutPage from "@/app/about/page";
import BetaPage from "@/app/beta/page";
import PrinciplesPage from "@/app/principles/page";
import SafetyPage from "@/app/safety/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import ReportStatusPage from "@/app/report-status/page";

(window as unknown as { __jinjuTossShare: typeof shareJinjuPost }).__jinjuTossShare = shareJinjuPost;

const ROUTES: Record<string, () => ReactNode> = {
  about: () => <AboutPage />,
  beta: () => <BetaPage />,
  principles: () => <PrinciplesPage />,
  safety: () => <SafetyPage />,
  privacy: () => <PrivacyPage />,
  terms: () => <TermsPage />,
  "report-status": () => <ReportStatusPage />,
};

type ApiPost = { id: string; title: string; content: string; category: string; displayName?: string; createdAt: string; heard: number; same: number; commentCount?: number };
function toClient(p: ApiPost): Post {
  const { createdAt, commentCount, ...rest } = p;
  return {
    ...rest,
    date: new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "numeric", day: "numeric" }).format(new Date(createdAt)),
    comments: Array.from({ length: commentCount ?? 0 }, (_, index) => ({ id: `count-${index}`, body: "", createdAt: "" })),
  };
}

// A shared link (intoss://jinju?post=…) opens that post first, like /post/[id] on the website.
async function sharedPost(): Promise<Post | null> {
  const id = new URLSearchParams(location.search).get("post");
  if (!id) return null;
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { post?: ApiPost };
    return data.post ? toClient(data.post) : null;
  } catch {
    return null;
  }
}

const page = location.pathname.replace(/^\/+/, "").replace(/\.html$/, "");
const render = ROUTES[page];
const openedPost = new URLSearchParams(location.search).get("post");
if (openedPost && new URLSearchParams(location.search).get(PEARL_ENTRY_PARAM) === PEARL_ENTRY_VALUE) {
  const style = document.createElement("style");
  style.textContent = pearlEntryStyle(openedPost);
  document.head.appendChild(style);
}
screen(Object.prototype.hasOwnProperty.call(ROUTES, page) ? page : openedPost ? "post_detail" : "home", openedPost ? { post_id: openedPost } : {});
if (openedPost) track("post_open", { post_id: openedPost, via: "link" });
const root = createRoot(document.getElementById("root")!);
if (render) {
  root.render(<><TossShareBridge />{render()}</>);
} else {
  void sharedPost().then((post) => {
    if (!post && new URLSearchParams(location.search).has("post")) history.replaceState({}, "", "/index.html");
    root.render(
      <>
        <TossShareBridge />
        {post ? <JinjuAppBridge initialPosts={[post]} initialPostId={post.id} /> : <JinjuAppBridge />}
      </>,
    );
  });
}
