export const PUBLIC_CATEGORIES = ["일상", "관계", "직장", "돈", "사회", "제안", "질문"] as const;

export type PublicCategory = (typeof PUBLIC_CATEGORIES)[number];

export function normalizePublicCategory(category: string): PublicCategory {
  if (category === "건강") return "사회";
  if (category === "문화") return "질문";
  return PUBLIC_CATEGORIES.includes(category as PublicCategory)
    ? category as PublicCategory
    : "일상";
}
