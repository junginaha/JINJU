import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./production-hotfix.css";
import "./bookgpt-tidy.css";
import {
  SITE_DESCRIPTION,
  SITE_DISCLAIMER,
  SITE_HOST,
  SITE_IDENTITY_DESCRIPTION,
  SITE_NAME,
  SITE_ORGANIZATION_ID,
  SITE_SAME_AS,
  SITE_TAGLINE,
  SITE_TITLE,
  SITE_URL,
  SITE_WEBSITE_ID,
} from "@/lib/search-indexing";
import ShareBridge from "@/components/ShareBridge";

const baseUrl = SITE_URL;
const siteName = SITE_NAME;
const siteTitle = SITE_TITLE;
const siteDescription = SITE_DESCRIPTION;

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
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  keywords: [
    "진주.kr",
    "JINJU.KR",
    "진주.kr 익명 커뮤니티",
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
  const identityGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": SITE_ORGANIZATION_ID,
        name: siteName,
        alternateName: ["JINJU.KR", "진주.kr 익명 커뮤니티", SITE_TAGLINE],
        url: `${baseUrl}/`,
        description: SITE_IDENTITY_DESCRIPTION,
        disambiguatingDescription: SITE_DISCLAIMER,
        ...(SITE_SAME_AS.length ? { sameAs: SITE_SAME_AS } : {}),
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/jinju-pearl-cutout.png`,
        },
      },
      {
        "@type": "WebSite",
        "@id": SITE_WEBSITE_ID,
        name: siteName,
        alternateName: ["JINJU.KR", "진주.kr 익명 의견 커뮤니티", "진주 익명 커뮤니티", SITE_TAGLINE, SITE_HOST],
        url: `${baseUrl}/`,
        description: siteDescription,
        disambiguatingDescription: SITE_DISCLAIMER,
        keywords: ["익명 의견", "익명 커뮤니티", "속마음", "개인정보 없는 커뮤니티"],
        ...(SITE_SAME_AS.length ? { sameAs: SITE_SAME_AS } : {}),
        inLanguage: "ko-KR",
        publisher: { "@id": SITE_ORGANIZATION_ID },
      },
    ],
  };
  return (
    <html lang="ko-KR">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(identityGraph).replace(/</g, "\\u003c") }} />
        <ShareBridge />
        {children}
      </body>
    </html>
  );
}
