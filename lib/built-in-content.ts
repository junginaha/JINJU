import { normalizePublicCategory } from "./categories";
import { dailyEditorialComments, dailyEditorialPosts } from "./daily-editorial";
import { isDuplicatePost } from "./dedup";
import { editorialComments, editorialPosts, type EditorialComment, type EditorialPost } from "./editorial";
import { launchEditorialComments, launchEditorialPosts } from "./launch-editorial";

function normalizePost(post: EditorialPost): EditorialPost {
  return { ...post, category: normalizePublicCategory(post.category) };
}

function chooseUniquePosts(posts: EditorialPost[]) {
  const sorted = posts.map(normalizePost).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const unique: EditorialPost[] = [];
  for (const post of sorted) {
    const duplicate = unique.some((kept) => post.id === kept.id || isDuplicatePost(post, kept));
    if (!duplicate) unique.push(post);
  }
  return unique;
}

export const builtInPosts = chooseUniquePosts([
  ...dailyEditorialPosts,
  ...launchEditorialPosts,
  ...editorialPosts,
]);

const postById = new Map(builtInPosts.map((post) => [post.id, post]));

export function builtInPost(id: string) {
  return postById.get(id) ?? null;
}

export function builtInComments(id: string): EditorialComment[] {
  const merged = new Map<string, EditorialComment>();
  for (const comment of [
    ...dailyEditorialComments(id),
    ...launchEditorialComments(id),
    ...editorialComments(id),
  ]) merged.set(String(comment.id), comment);
  return [...merged.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}
