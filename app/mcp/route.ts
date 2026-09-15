import { createJinjuMcpHandler } from "../../lib/jinju-mcp";
import { getPublicPosts } from "../../lib/public-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createJinjuMcpHandler(getPublicPosts);
export { handler as POST, handler as GET, handler as DELETE };
