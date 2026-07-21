import JinjuApp from "@/components/JinjuApp";
import { getPublicPosts, toClientPost } from "@/lib/public-posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialPosts = (await getPublicPosts()).map(toClientPost);
  return <JinjuApp initialPosts={initialPosts} />;
}
