const PUBLIC_HOSTS = new Set([
  "xn--o55b9n.kr",
  "www.xn--o55b9n.kr",
  "jinju-two.vercel.app",
]);
const IN_APP_USER_AGENT = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\/|DaumApps/i;

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export type TurnstileVerification =
  | { ok: true; required: boolean }
  | { ok: false; status: number; error: string };

function normalizeHost(value: string) {
  return value.trim().toLowerCase().split(":")[0];
}

export function isJinjuPublicHost(hostname: string) {
  return PUBLIC_HOSTS.has(normalizeHost(hostname));
}

function requestHost(request: Request) {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0] || "";
  const direct = request.headers.get("host") || "";
  return normalizeHost(forwarded || direct || new URL(request.url).hostname);
}

function inAppPostFallbackReady(request: Request) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!IN_APP_USER_AGENT.test(userAgent)) return false;
  return Boolean(
    process.env.ABUSE_HMAC_SECRET
    || process.env.RATE_LIMIT_SECRET
    || process.env.TURNSTILE_SECRET_KEY,
  );
}

export async function verifyTurnstile(
  request: Request,
  token: string | undefined,
  expectedAction: "post" | "comment" | "feedback",
): Promise<TurnstileVerification> {
  const host = requestHost(request);
  if (!isJinjuPublicHost(host)) return { ok: true, required: false };

  const responseToken = token?.trim() || "";

  // 댓글은 rate limit, 중복 댓글 차단, 게시 전 안전 검수로 별도 보호한다.
  // iOS 인앱 웹뷰에서 Turnstile이 로드되지 않아 정상 댓글까지 막는 상황을 피하기 위해
  // 댓글 요청은 토큰이 없을 때 Turnstile을 필수로 요구하지 않는다.
  if (expectedAction === "comment" && !responseToken) {
    return { ok: true, required: false };
  }

  // 카카오·네이버 등 인앱 브라우저에서만 글쓰기 Turnstile이 로드되지 않는 경우,
  // 서버 HMAC 기반 rate limit과 게시 전 안전 검수를 대체 보호선으로 사용한다.
  // 일반 브라우저와 문제제보는 기존 Turnstile 필수 정책을 유지한다.
  if (expectedAction === "post" && !responseToken && inAppPostFallbackReady(request)) {
    return { ok: true, required: false };
  }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!siteKey || !secret) {
    return {
      ok: false,
      status: 503,
      error: "보안 확인 설정을 점검하고 있습니다. 작성한 내용은 그대로 두고 잠시 후 다시 시도해주세요.",
    };
  }

  if (!responseToken || responseToken.length > 2048) {
    return { ok: false, status: 400, error: "보안 확인을 완료한 뒤 다시 눌러주세요." };
  }

  try {
    const body = new URLSearchParams({ secret, response: responseToken });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok) throw new Error("Turnstile Siteverify request failed");
    const result = await response.json() as TurnstileResponse;
    if (
      !result.success
      || result.action !== expectedAction
      || !result.hostname
      || !isJinjuPublicHost(result.hostname)
    ) {
      return { ok: false, status: 400, error: "보안 확인이 만료되었거나 올바르지 않습니다. 다시 확인해주세요." };
    }
    return { ok: true, required: true };
  } catch (error) {
    console.error("[turnstile] verification unavailable", error);
    return {
      ok: false,
      status: 503,
      error: "보안 확인 서비스에 잠시 연결할 수 없습니다. 작성한 내용은 그대로 두고 다시 시도해주세요.",
    };
  }
}

export function turnstileFailure(result: Exclude<TurnstileVerification, { ok: true }>) {
  return Response.json(
    { error: result.error },
    { status: result.status, headers: { "cache-control": "no-store" } },
  );
}
