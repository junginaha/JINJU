import JinjuApp from "@/components/JinjuApp";
import { editorialPosts } from "@/lib/editorial";
import { dedupePosts } from "@/lib/dedup";
import { toClientPost } from "@/lib/public-posts";

export default function Home() {
  const initialPosts = dedupePosts(editorialPosts)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toClientPost);
  return <JinjuApp initialPosts={initialPosts} />;
}
