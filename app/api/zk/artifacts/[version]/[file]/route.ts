import { ZK_ARTIFACT_VERSION, ZK_TREE_DEPTH } from "../../../../../../lib/zk-shared";

const ARTIFACTS = new Map([
  [`semaphore-${ZK_TREE_DEPTH}.wasm`, "application/wasm"],
  [`semaphore-${ZK_TREE_DEPTH}.zkey`, "application/octet-stream"],
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ version: string; file: string }> },
) {
  const { version, file } = await context.params;
  const contentType = ARTIFACTS.get(file);
  if (version !== ZK_ARTIFACT_VERSION || !contentType) {
    return Response.json({ error: "암호 증명 파일을 찾을 수 없습니다." }, { status: 404 });
  }

  const upstream = await fetch(
    `https://snark-artifacts.pse.dev/semaphore/${ZK_ARTIFACT_VERSION}/${file}`,
    { next: { revalidate: 30 * 24 * 60 * 60 } },
  );
  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: "암호 증명 파일을 불러오지 못했습니다." }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=2592000, s-maxage=2592000, immutable",
    },
  });
}
