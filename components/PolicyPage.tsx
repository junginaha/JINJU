import type { ReactNode } from "react";

export default function PolicyPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <main className="policy-page"><header><a href="/">← 진주로 돌아가기</a><p>{eyebrow}</p><h1>{title}</h1></header><div className="policy-content">{children}</div></main>;
}
