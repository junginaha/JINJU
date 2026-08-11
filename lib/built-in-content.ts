import { bookclubEditorialComments, bookclubEditorialPosts } from "./bookclub-editorial-20260730";
import { normalizePublicCategory } from "./categories";
import { dailyEditorialComments, dailyEditorialPosts } from "./daily-editorial";
import { july29EditorialComments, july29EditorialPosts } from "./daily-editorial-20260729";
import { july30EditorialComments, july30EditorialPosts } from "./daily-editorial-20260730";
import { july31EditorialComments, july31EditorialPosts } from "./daily-editorial-20260731";
import { august1EditorialComments, august1EditorialPosts } from "./daily-editorial-20260801";
import { august2EditorialComments, august2EditorialPosts } from "./daily-editorial-20260802";
import { august3EditorialComments, august3EditorialPosts } from "./daily-editorial-20260803";
import { august4EditorialComments, august4EditorialPosts } from "./daily-editorial-20260804";
import { august5EditorialComments, august5EditorialPosts } from "./daily-editorial-20260805";
import { august6EditorialComments, august6EditorialPosts } from "./daily-editorial-20260806";
import { august7EditorialComments, august7EditorialPosts } from "./daily-editorial-20260807";
import { august9EditorialComments, august9EditorialPosts } from "./daily-editorial-20260809";
import { august11EditorialComments, august11EditorialPosts } from "./daily-editorial-20260811";
import { august12EditorialComments, august12EditorialPosts } from "./daily-editorial-20260812";
import { august5MorningComments, august5MorningPosts } from "./morning-editorial-20260805";
import { august6MorningComments, august6MorningPosts } from "./morning-editorial-20260806";
import { august8MorningComments, august8MorningPosts } from "./morning-editorial-20260808";
import { august9MorningComments, august9MorningPosts } from "./morning-editorial-20260809";
import { august10MorningComments, august10MorningPosts } from "./morning-editorial-20260810";
import { august12MorningComments, august12MorningPosts } from "./morning-editorial-20260812";
import { createDuplicatePostChecker } from "./dedup";
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
  const isDuplicatePost = createDuplicatePostChecker();
  for (const post of sorted) {
    const duplicate = unique.some((kept) => post.id === kept.id || isDuplicatePost(post, kept));
    if (!duplicate) unique.push(post);
  }
  return unique;
}

export const builtInPosts = chooseUniquePosts([
  ...august12EditorialPosts,
  ...august12MorningPosts,
  ...august11EditorialPosts,
  ...august10MorningPosts,
  ...august9MorningPosts,
  ...august9EditorialPosts,
  ...august8MorningPosts,
  ...august7EditorialPosts,
  ...august6EditorialPosts,
  ...august6MorningPosts,
  ...august5EditorialPosts,
  ...august5MorningPosts,
  ...august4EditorialPosts,
  ...august3EditorialPosts,
  ...august2EditorialPosts,
  ...august1EditorialPosts,
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
    ...august12EditorialComments(id),
    ...august12MorningComments(id),
    ...august11EditorialComments(id),
    ...august10MorningComments(id),
    ...august9MorningComments(id),
    ...august9EditorialComments(id),
    ...august8MorningComments(id),
    ...august7EditorialComments(id),
    ...august6EditorialComments(id),
    ...august6MorningComments(id),
    ...august5EditorialComments(id),
    ...august5MorningComments(id),
    ...august4EditorialComments(id),
    ...august3EditorialComments(id),
    ...august2EditorialComments(id),
    ...august1EditorialComments(id),
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
