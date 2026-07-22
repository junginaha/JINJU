const FIRST = [
  "가벼운", "고른", "고요한", "기다린", "기분좋은", "깨어난", "느긋한", "느린",
  "다정한", "단단한", "담백한", "동그란", "맑은", "말랑한", "명랑한", "반듯한",
  "반짝인", "바삭한", "보드라운", "부지런한", "새벽의", "선명한", "소박한", "솔직한",
  "수줍은", "씩씩한", "여유로운", "온화한", "웃음난", "은빛", "잔잔한", "정직한",
  "조용한", "차분한", "천천한", "푸른", "포근한", "환한", "흐르는", "흔들린",
  "기특한", "또렷한", "따뜻한", "엉뚱한", "용감한", "재빠른", "차오른", "한결같은",
] as const;

const SECOND = [
  "가로등", "계단", "고래", "고무줄", "구름", "국자", "귤", "기차표",
  "나침반", "노을", "느티나무", "달력", "달빛", "대문", "도마", "두부",
  "라디오", "라임", "마루", "마침표", "만두", "메모장", "모래알", "모카",
  "물결", "미로", "바람", "반달", "복숭아", "봄날", "비누", "빗방울",
  "서랍", "소라", "수건", "수평선", "식탁", "연필", "영수증", "오렌지",
  "우산", "유리", "윤슬", "의자", "자개장", "자몽", "전구", "종이컵",
  "주판", "찻잔", "창문", "초침", "쿠션", "타이머", "토요일", "파랑",
  "편지", "하이파이브", "한지", "현관", "회로", "휴지통", "빌리", "지현",
] as const;

function randomItem<T>(items: readonly T[]) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return items[values[0] % items.length];
}

export function generateJinjuDisplayName() {
  return `${randomItem(FIRST)} ${randomItem(SECOND)}`;
}

export async function generateUniqueJinjuDisplayName(isTaken: (name: string) => Promise<boolean>) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = generateJinjuDisplayName();
    if (!await isTaken(candidate)) return candidate;
  }
  return generateJinjuDisplayName();
}
