import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "진주.kr — 익명 의견 커뮤니티",
    short_name: "진주.kr",
    description: "개인정보 없이 인간적으로 할 말을 하는 익명 의견 커뮤니티입니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#171717",
    theme_color: "#171717",
    lang: "ko-KR",
    icons: [{ src: "/jinju-pearl-cutout.png", sizes: "512x512", type: "image/png" }],
  };
}
