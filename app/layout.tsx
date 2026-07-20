import type { Metadata, Viewport } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://진주.kr";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "진주 — 진실의 주둥이",
  description: "개인정보 없이 솔직한 의견을 나누는 익명 커뮤니티",
  openGraph: {
    title: "진주 — 진실의 주둥이",
    description: "할 말은 하세요!",
    locale: "ko_KR",
    type: "website",
    images: ["/jinju-pearl-cutout.png"]
  },
  icons: { icon: "/jinju-pearl-cutout.png", apple: "/jinju-pearl-cutout.png" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
