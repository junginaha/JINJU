import { bookclubEditorialComments, bookclubEditorialPosts } from "./bookclub-editorial-20260730";
import { normalizePublicCategory } from "./categories";
import { dailyEditorialComments, dailyEditorialPosts } from "./daily-editorial";
import { july29EditorialComments, july29EditorialPosts } from "./daily-editorial-20260729";
import { july30EditorialComments, july30EditorialPosts } from "./daily-editorial-20260730";
import { july31EditorialComments, july31EditorialPosts } from "./daily-editorial-20260731";
import { isDuplicatePost } from "./dedup";
import { editorialComments, editorialPosts, type EditorialComment, type EditorialPost } from "./editorial";
import { launchEditorialComments, launchEditorialPosts } from "./launch-editorial";

function normalizePost(post: EditorialPost): EditorialPost {
  return {
    ...post,
    category: normalizePublicCategory(post.category),
    heard: Math.max(10, post.heard),
  };
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
  ...july31EditorialPosts,
  ...bookclubEditorialPosts,
  ...july30EditorialPosts,
  ...july29EditorialPosts,
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
    ...july31EditorialComments(id),
    ...bookclubEditorialComments(id),
    ...july30EditorialComments(id),
    ...july29EditorialComments(id),
    ...dailyEditorialComments(id),
    ...launchEditorialComments(id),
    ...editorialComments(id),
  ]) merged.set(String(comment.id), comment);
  return [...merged.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}
