const STOP_WORDS = new Set([
  "그리고", "그런데", "하지만", "그래서", "저는", "제가", "나는", "내가", "오늘", "정말", "그냥", "조금", "너무", "있습니다", "했습니다", "합니다", "입니다", "같아요", "때문에", "대한", "이번", "이런", "저런", "우리", "하는", "되는", "있는", "없는", "것은", "것이", "것도", "하고", "해서", "하면"
]);

export function generateCoreTitle(text: string) {
  const clean = text.replace(/https?:\/\/\S+/g, " ").replace(/[“”‘’\"']/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return "제목 없는 진주";
  const source = clean.slice(0, 700);
  const matches = [...source.matchAll(/[가-힣A-Za-z0-9]{2,}/g)];
  const frequency = new Map<string, number>();
  for (const match of matches) {
    const word = match[0];
    if (!STOP_WORDS.has(word)) frequency.set(word, (frequency.get(word) || 0) + 1);
  }
  const ranked = matches
    .map((match, index) => ({ word: match[0], index, score: (frequency.get(match[0]) || 0) * 4 + Math.max(0, 5 - index / 4) }))
    .filter((item, index, all) => !STOP_WORDS.has(item.word) && all.findIndex((other) => other.word === item.word) === index)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.index - b.index);
  const phrase = ranked.map((item) => item.word).join(" ").trim();
  if (phrase.length >= 4) return phrase.slice(0, 52).trim();
  const sentence = clean.split(/[.!?。！？\n]/)[0].trim();
  return (sentence || clean).slice(0, 52).trim();
}
