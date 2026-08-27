import { appendFileSync, readFileSync } from "node:fs";

function output(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${String(value).replace(/\r?\n/g, " ")}\n`);
}

output("phase", "prepare");

const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN?.trim();
if (!clientId || !clientSecret || !refreshToken) throw new Error("youtube_credentials_not_configured");

const job = JSON.parse(readFileSync(".social-youtube-job.json", "utf8"));
const video = readFileSync(".social-youtube-short.mp4");
const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }),
});
const tokenBody = await tokenResponse.json();
if (!tokenResponse.ok || !tokenBody.access_token) throw new Error(`youtube_token_${tokenResponse.status}`);

const metadataResponse = await fetch(
  "https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable&notifySubscribers=false",
  {
    method: "POST",
    headers: {
      authorization: `Bearer ${tokenBody.access_token}`,
      "content-type": "application/json; charset=UTF-8",
      "x-upload-content-length": String(video.byteLength),
      "x-upload-content-type": "video/mp4",
    },
    body: JSON.stringify({
      snippet: {
        title: job.title,
        description: job.description,
        categoryId: "22",
        defaultLanguage: "ko",
        defaultAudioLanguage: "ko",
        tags: ["진주kr", "익명커뮤니티", "생활공감", "shorts"],
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    }),
  },
);
const uploadUrl = metadataResponse.headers.get("location");
if (!metadataResponse.ok || !uploadUrl) throw new Error(`youtube_upload_prepare_${metadataResponse.status}`);

output("phase", "publish");
const uploadResponse = await fetch(uploadUrl, {
  method: "PUT",
  headers: { "content-type": "video/mp4", "content-length": String(video.byteLength) },
  body: video,
  duplex: "half",
});
const uploadBody = await uploadResponse.json();
if (!uploadResponse.ok || !uploadBody.id) throw new Error(`youtube_upload_${uploadResponse.status}`);

const verifyResponse = await fetch(
  `https://www.googleapis.com/youtube/v3/videos?part=id,status&id=${encodeURIComponent(uploadBody.id)}`,
  { headers: { authorization: `Bearer ${tokenBody.access_token}` } },
);
const verifyBody = await verifyResponse.json();
const verified = verifyBody.items?.find((item) => item.id === uploadBody.id);
if (!verifyResponse.ok || !verified || verified.status?.privacyStatus !== "public") {
  throw new Error(`youtube_public_verification_${verifyResponse.status}`);
}

output("phase", "complete");
output("video_id", uploadBody.id);
output("public_url", `https://www.youtube.com/shorts/${uploadBody.id}`);
console.log(`Published ${uploadBody.id}`);
