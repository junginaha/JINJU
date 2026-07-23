import type { Metadata, Viewport } from "next";
import "./globals.css";

const baseUrl = "https://xn--o55b9n.kr";
const siteName = "진주.kr";
const siteTitle = "진주.kr | 인간적으로, 할 말은 하세요";
const siteDescription =
  "개인정보 0%를 지향하며 속마음을 안전하고 개운하게 나누는 익명 의견 커뮤니티 진주입니다.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  applicationName: siteName,
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  authors: [{ name: siteName, url: baseUrl }],
  creator: siteName,
  publisher: siteName,
  category: "community",
  alternates: {
    canonical: "/",
    languages: { "ko-KR": "/" },
  },
  keywords: [
    "진주.kr",
    "진주 익명 커뮤니티",
    "익명 커뮤니티",
    "익명 게시판",
    "익명 의견",
    "익명 글쓰기",
    "속마음",
    "고민 나눔",
    "직장 고민",
    "관계 고민",
    "사회 이슈",
    "개인정보 없는 커뮤니티",
  ],
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    other: {
      "naver-site-verification": "2d617f45396cbe01f3ec2d642cbec552fb64b827",
    },
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName,
    url: "/",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/jinju-pearl-cutout.png", apple: "/jinju-pearl-cutout.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: siteName,
    alternateName: ["진주 익명 커뮤니티", "진실의 주둥이", "xn--o55b9n.kr"],
    url: `${baseUrl}/`,
    description: siteDescription,
    inLanguage: "ko-KR",
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: `${baseUrl}/`,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/jinju-pearl-cutout.png`,
      },
    },
  };
  return (
    <html lang="ko-KR">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, "\\u003c") }} />
        {children}
      </body>
    </html>
  );
}
