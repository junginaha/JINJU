const GITHUB_ISSUER = "https://token.actions.githubusercontent.com";
const SOCIAL_AUDIENCE = "jinju-social-publisher";

type GithubClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  repository?: string;
  ref?: string;
  event_name?: string;
  workflow_ref?: string;
};

type JwtHeader = { alg?: string; kid?: string; typ?: string };
type GithubJwk = JsonWebKey & { kid?: string };
type JwkSet = { keys?: GithubJwk[] };

let keyCache: { expiresAt: number; keys: GithubJwk[] } | null = null;

function decodePart<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function audienceMatches(audience: string | string[] | undefined) {
  return Array.isArray(audience) ? audience.includes(SOCIAL_AUDIENCE) : audience === SOCIAL_AUDIENCE;
}

export function validGithubSocialClaims(
  claims: GithubClaims,
  nowSeconds = Math.floor(Date.now() / 1000),
  repository = process.env.SOCIAL_GITHUB_REPOSITORY?.trim() || "junginaha/JINJU",
) {
  if (claims.iss !== GITHUB_ISSUER || !audienceMatches(claims.aud)) return false;
  if (!claims.exp || claims.exp < nowSeconds || (claims.nbf && claims.nbf > nowSeconds + 30)) return false;
  if (!claims.iat || Math.abs(nowSeconds - claims.iat) > 10 * 60) return false;
  if (claims.repository !== repository || claims.ref !== "refs/heads/main") return false;
  if (!['schedule', 'workflow_dispatch'].includes(claims.event_name || "")) return false;
  return claims.workflow_ref === `${repository}/.github/workflows/social-publish.yml@refs/heads/main`;
}

async function githubKeys() {
  if (keyCache && keyCache.expiresAt > Date.now()) return keyCache.keys;
  const response = await fetch(`${GITHUB_ISSUER}/.well-known/jwks`, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error("github_oidc_keys_unavailable");
  const result = await response.json() as JwkSet;
  if (!Array.isArray(result.keys) || !result.keys.length) throw new Error("github_oidc_keys_missing");
  keyCache = { keys: result.keys, expiresAt: Date.now() + 10 * 60_000 };
  return result.keys;
}

export async function verifyGithubSocialRequest(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  let header: JwtHeader;
  let claims: GithubClaims;
  try {
    header = decodePart<JwtHeader>(parts[0]);
    claims = decodePart<GithubClaims>(parts[1]);
  } catch {
    return false;
  }
  if (header.alg !== "RS256" || !header.kid || !validGithubSocialClaims(claims)) return false;
  const jwk = (await githubKeys()).find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) return false;
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    Buffer.from(parts[2], "base64url"),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
}
