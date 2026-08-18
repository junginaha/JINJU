const NAME_FAMILIES = [
  {
    first: ["고요한", "잔잔한", "깊은", "푸른", "맑은", "은은한"],
    second: ["여백", "윤슬", "수평선", "물결", "달빛", "바람"],
  },
  {
    first: ["단정한", "담백한", "정갈한", "반듯한", "선명한", "또렷한"],
    second: ["문장", "기록", "한지", "책갈피", "잉크", "마침표"],
  },
  {
    first: ["다정한", "온화한", "따뜻한", "부드러운", "포근한", "여유로운"],
    second: ["창가", "정원", "편지", "산책", "서재", "동행"],
  },
  {
    first: ["사려깊은", "차분한", "유연한", "고른", "성실한", "신중한"],
    second: ["독자", "이웃", "청자", "관찰자", "조율자", "탐구자"],
  },
  {
    first: ["느린", "한적한", "평온한", "정다운", "소박한", "담담한"],
    second: ["새벽", "노을", "숲길", "해안", "골목", "정류장"],
  },
  {
    first: ["넓은", "열린", "곧은", "섬세한", "현명한", "반가운"],
    second: ["시선", "질문", "대화", "생각", "마음", "관점"],
  },
] as const;

const DISPLAY_NAMES = NAME_FAMILIES.flatMap(({ first, second }) => (
  first.flatMap((prefix) => second.map((suffix) => `${prefix} ${suffix}`))
));

const LEGACY_AWKWARD_FIRST = new Set([
  "기분좋은", "깨어난", "동그란", "말랑한", "명랑한", "반짝인", "바삭한",
  "보드라운", "부지런한", "수줍은", "씩씩한", "웃음난", "흔들린", "기특한",
  "엉뚱한", "용감한", "재빠른", "차오른",
]);

const LEGACY_AWKWARD_SECOND = new Set([
  "고무줄", "국자", "귤", "도마", "두부", "만두", "모카", "복숭아", "비누",
  "수건", "식탁", "영수증", "오렌지", "자몽", "전구", "종이컵", "주판", "쿠션",
  "타이머", "하이파이브", "회로", "휴지통", "빌리", "지현",
]);

function stableNumber(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function randomItem<T>(items: readonly T[]) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return items[values[0] % items.length];
}

export function deterministicJinjuDisplayName(stableKey: string, index = 0) {
  const start = stableNumber(`${stableKey}:jinju-display-name`) % DISPLAY_NAMES.length;
  return DISPLAY_NAMES[(start + index * 37) % DISPLAY_NAMES.length];
}

export function refinedJinjuDisplayName(name: string, stableKey: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  const words = clean.split(" ");
  if (words.length !== 2) return clean || "익명";
  if (!LEGACY_AWKWARD_FIRST.has(words[0]) && !LEGACY_AWKWARD_SECOND.has(words[1])) return clean;
  return deterministicJinjuDisplayName(`legacy:${stableKey || clean}`);
}

export function generateJinjuDisplayName() {
  return randomItem(DISPLAY_NAMES);
}

export async function generateUniqueJinjuDisplayName(isTaken: (name: string) => Promise<boolean>) {
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const candidate = generateJinjuDisplayName();
    if (!await isTaken(candidate)) return candidate;
  }
  return generateJinjuDisplayName();
}
