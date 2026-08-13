import { rateLimit } from "../../../lib/rate-limit";

export const runtime = "nodejs";

const UPSTREAM_TIMEOUT_MS = 24_000;
const MAX_AUDIO_BYTES = 6 * 1024 * 1024;

type UpstreamPayload = { text?: string; error?: { message?: string } };

function clean(value: FormDataEntryValue | null, maxLength: number) {
  return String(value || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, maxLength);
}

async function wait(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function POST(request: Request) {
  try {
    const limit = await rateLimit(request, "transcribe", 48, 10 * 60_000);
    if (!limit.allowed) return Response.json({ error: "음성 요청이 잠시 몰렸습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });

    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size < 100) return Response.json({ error: "음성 파일을 확인할 수 없습니다." }, { status: 400 });
    if (audio.size > MAX_AUDIO_BYTES) return Response.json({ error: "한 번에 확인할 음성이 너무 깁니다." }, { status: 413 });

    const key = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    if (!key) return Response.json({ error: "음성 변환 설정이 필요합니다." }, { status: 503 });

    const fieldValue = clean(form.get("field"), 20) || "body";
    const field = fieldValue === "title" ? "제목" : fieldValue === "query" ? "검색어" : fieldValue === "comment" ? "댓글" : "본문";
    const context = clean(form.get("context"), 1000);
    const category = clean(form.get("category"), 30).replace(/[^가-힣a-zA-Z0-9 ]/g, "");
    const title = clean(form.get("title"), 120);
    const hints = clean(form.get("hints"), 500);
    const chunkIndex = Number.parseInt(clean(form.get("chunkIndex"), 4) || "0", 10);
    const prompt = [
      fieldValue === "query"
        ? "익명 커뮤니티 진주의 검색어를 한국어로 받아씁니다."
        : fieldValue === "comment"
          ? `익명 커뮤니티 진주의 ${category || "일반"} 게시글 댓글을 한국어로 받아씁니다.`
          : `익명 커뮤니티 진주의 ${category || "일반"} 게시판 ${field}을 한국어로 받아씁니다.`,
      `이 녹음은 긴 발화를 나눈 ${Number.isFinite(chunkIndex) ? chunkIndex + 1 : 1}번째 구간입니다. 앞뒤 문장을 자연스럽게 이어지게 적습니다.`,
      "말한 내용을 요약하거나 새 내용을 보태지 말고 들린 표현을 그대로 정확히 적습니다. 자연스러운 한국어 띄어쓰기와 문장부호를 사용합니다.",
      title ? `게시글 제목: ${title}` : "",
      hints ? `고유명사·책 이름·외래어·숫자 후보: ${hints}` : "",
      context ? `앞서 작성한 문맥: ${context}` : "",
    ].filter(Boolean).join("\n");

    const endpoint = process.env.AI_TRANSCRIBE_ENDPOINT || "https://api.openai.com/v1/audio/transcriptions";
    const model = process.env.AI_TRANSCRIBE_MODEL || "gpt-4o-transcribe";
    let lastError = "음성을 글로 바꾸지 못했습니다.";
    let timedOut = false;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const body = new FormData();
        body.append("file", audio, audio.name || "jinju-voice.webm");
        body.append("model", model);
        body.append("language", "ko");
        body.append("prompt", prompt);
        body.append("response_format", "json");
        body.append("temperature", "0");
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { authorization: `Bearer ${key}` },
          body,
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });
        const data = await response.json().catch(() => ({})) as UpstreamPayload;
        if (response.ok && data.text?.trim()) {
          return Response.json({ text: data.text.trim().slice(0, fieldValue === "query" ? 200 : 2000), precise: true }, { headers: { "cache-control": "no-store" } });
        }
        lastError = data.error?.message || lastError;
        const retryable = response.status === 408 || response.status === 409 || response.status === 429 || response.status >= 500;
        if (!retryable || attempt === 1) break;
      } catch (error) {
        timedOut = error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError");
        lastError = timedOut ? "정밀 음성 확인 시간이 초과됐습니다." : "정밀 음성 확인 연결이 끊겼습니다.";
        if (attempt === 1) break;
      }
      await wait(350);
    }

    return Response.json({ error: lastError, precise: false }, { status: timedOut ? 504 : 502 });
  } catch {
    return Response.json({ error: "음성 입력을 처리할 수 없습니다.", precise: false }, { status: 400 });
  }
}

