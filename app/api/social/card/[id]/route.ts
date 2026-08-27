import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createElement } from "react";
import { ImageResponse } from "next/og";
import { getPublicPost } from "@/lib/public-posts";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const post = await getPublicPost(id);
  if (!post) return new Response("Not found", { status: 404 });
  const pearl = await readFile(join(process.cwd(), "public", "jinju-pearl-cutout.png"), "base64");
  const excerpt = post.content.replace(/\s+/gu, " ").trim().slice(0, 150);
  const element = createElement("div", {
    style: {
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "space-between", padding: "82px 76px 64px", position: "relative",
      overflow: "hidden", background: "#0b0b0c", color: "#f8f8f8", fontFamily: "sans-serif",
    },
  },
  createElement("div", {
    style: { position: "absolute", inset: 0, display: "flex", background: "radial-gradient(circle at 86% 12%, rgba(255, 126, 135, .24), transparent 35%), radial-gradient(circle at 14% 82%, rgba(120, 223, 229, .18), transparent 38%)" },
  }),
  createElement("div", { style: { display: "flex", flexDirection: "column" } },
    createElement("div", { style: { display: "flex", fontSize: 31, fontWeight: 700, color: "#9fe7eb", marginBottom: 52 } }, "진주.kr · 오늘의 이야기"),
    createElement("div", { style: { display: "flex", fontSize: 66, lineHeight: 1.24, letterSpacing: "-.045em", fontWeight: 800, wordBreak: "keep-all" } }, post.title),
    createElement("div", { style: { display: "flex", fontSize: 28, lineHeight: 1.55, letterSpacing: "-.02em", color: "#c9c9ce", marginTop: 42, wordBreak: "keep-all" } }, excerpt),
  ),
  createElement("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between" } },
    createElement("div", { style: { display: "flex", flexDirection: "column" } },
      createElement("div", { style: { display: "flex", fontSize: 27, fontWeight: 700 } }, "개인정보 없이, 할 말은 하세요"),
      createElement("div", { style: { display: "flex", fontSize: 22, color: "#a9a9ae", marginTop: 12 } }, "전국 누구나 쓰는 독립 익명 의견 커뮤니티"),
    ),
    createElement("img", { alt: "", src: `data:image/png;base64,${pearl}`, width: 210, height: 210, style: { objectFit: "contain", filter: "drop-shadow(0 18px 30px rgba(255, 220, 225, .22))" } }),
  ),
  createElement("div", { style: { position: "absolute", left: 76, right: 76, bottom: 34, height: 5, display: "flex", borderRadius: 999, background: "linear-gradient(90deg, #78dfe5 0%, #e7e1f7 50%, #ff7e87 100%)" } }));

  return new ImageResponse(element, {
    width: 1080,
    height: 1350,
    headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
