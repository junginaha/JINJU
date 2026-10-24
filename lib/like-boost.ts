// 공개 화면의 좋아요 수에 게시글마다 고정된 10~15를 더합니다. 저장된 값은 바꾸지 않습니다.
function stableNumber(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function likeBoost(postId: string) {
  return 10 + (stableNumber(`${postId}:like-boost-20261024`) % 6);
}

export function withLikeBoost<T extends { id: string; heard: number }>(post: T): T {
  return { ...post, heard: Number(post.heard) + likeBoost(post.id) };
}
