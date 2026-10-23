import { selectTodaysPearl } from "@/lib/todays-pearl";
import JinjuApp from "@/components/JinjuAppBridge";
import { getPublicPosts, toClientPost } from "@/lib/public-posts";

export const revalidate = 30;

export default async function Home() {
  const publicPosts = await getPublicPosts();
  const initialPosts = publicPosts.slice(0, 30).map(toClientPost);

  return <JinjuApp initialPosts={initialPosts} initialTotal={publicPosts.length} initialPearl={selectTodaysPearl(publicPosts)} />;
}
