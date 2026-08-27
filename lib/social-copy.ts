import type { EditorialPost } from "./editorial";
import { canonicalUrl } from "./search-indexing";

export type SocialChannel = "instagram" | "threads" | "naver_cafe" | "youtube";

export type SocialCopyBundle = {
  campaign: string;
  instagram: { caption: string; imageUrl: string; postUrl: string };
  threads: { text: string; postUrl: string };
  naverCafe: { subject: string; content: string; postUrl: string };
  youtube: {
    title: string;
    description: string;
    script: string;
    imageUrl: string;
    postUrl: string;
  };
};

function compact(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

function trimAtSentence(value: string, maxLength: number) {
  const normalized = compact(value);
  if (normalized.length <= maxLength) return normalized;
  const candidate = normalized.slice(0, maxLength + 1);
  const lastSentence = Math.max(candidate.lastIndexOf("."), candidate.lastIndexOf("?"), candidate.lastIndexOf("!"));
  if (lastSentence >= Math.floor(maxLength * 0.55)) return candidate.slice(0, lastSentence + 1).trim();
  const lastSpace = candidate.lastIndexOf(" ", maxLength);
  return `${candidate.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}…`;
}

export function socialCampaign(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `jinju_daily_${values.year}${values.month}${values.day}`;
}

export function socialPostUrl(postId: string, channel: SocialChannel, campaign: string) {
  const medium = channel === "naver_cafe" ? "community" : channel === "youtube" ? "video" : "social";
  const source = channel === "naver_cafe" ? "naver" : channel;
  const url = new URL(canonicalUrl(`/post/${encodeURIComponent(postId)}`));
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

export function buildSocialCopy(post: EditorialPost, now = new Date()): SocialCopyBundle {
  const campaign = socialCampaign(now);
  const excerpt = trimAtSentence(post.content, 210);
  const instagramUrl = socialPostUrl(post.id, "instagram", campaign);
  const threadsUrl = socialPostUrl(post.id, "threads", campaign);
  const naverUrl = socialPostUrl(post.id, "naver_cafe", campaign);
  const youtubeUrl = socialPostUrl(post.id, "youtube", campaign);

  const instagramCaption = [
    post.title,
    excerpt,
    "이 장면, 여러분이라면 어떻게 하셨을까요? 진주.kr에서 익명으로 생각을 나눠주세요.",
    instagramUrl,
    "#진주kr #익명커뮤니티 #생활공감 #할말은하세요",
  ].join("\n\n");

  const threadsText = trimAtSentence([
    post.title,
    excerpt,
    "여러분의 기준도 궁금합니다.",
    threadsUrl,
  ].join("\n\n"), 500);

  const naverContent = [
    `<strong>${post.title}</strong>`,
    compact(post.content),
    "진주.kr은 전국 누구나 쓰는 독립 익명 의견 커뮤니티입니다. 개인정보 없이, 할 말은 하세요.",
    `<a href=\"${naverUrl}\" target=\"_blank\" rel=\"noopener noreferrer\">진주.kr에서 익명으로 의견 나누기</a>`,
  ].join("<br><br>");

  const youtubeScript = trimAtSentence([
    "진주.kr 오늘의 이야기입니다.",
    post.title,
    trimAtSentence(post.content, 150),
    "여러분은 어떻게 생각하시나요? 개인정보 없이, 할 말은 하세요.",
  ].join(" "), 360);
  const youtubeDescription = [
    post.title,
    trimAtSentence(post.content, 220),
    `익명으로 의견 나누기: ${youtubeUrl}`,
    "이 영상의 음성은 AI로 생성했습니다.",
    "#진주kr #익명커뮤니티 #생활공감 #shorts",
  ].join("\n\n");

  return {
    campaign,
    instagram: {
      caption: instagramCaption,
      imageUrl: canonicalUrl(`/api/social/card/${encodeURIComponent(post.id)}`),
      postUrl: instagramUrl,
    },
    threads: { text: threadsText, postUrl: threadsUrl },
    naverCafe: {
      subject: trimAtSentence(post.title, 80),
      content: naverContent,
      postUrl: naverUrl,
    },
    youtube: {
      title: trimAtSentence(`${post.title} | 진주.kr`, 100),
      description: youtubeDescription,
      script: youtubeScript,
      imageUrl: canonicalUrl(`/api/social/youtube/card/${encodeURIComponent(post.id)}`),
      postUrl: youtubeUrl,
    },
  };
}
