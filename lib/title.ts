const COMPLETE_ENDING = /(다|요|죠|까요|나요|가요|인가요|일까요|습니까|합니다|입니다|했어요|싶어요|같아요)[.!?]?$/;
const QUESTION_CUE = /(왜|어떻게|어디|누가|무엇|뭘|어느|얼마나|괜찮을까요|맞을까요|일까요|인가요|할까요|하나요)/;
const CORE_CUE = /(생각|마음|고민|궁금|걱정|서운|불편|억울|속상|좋아|싫어|바라|원하|어렵|힘들|문제|이해|느꼈|느낌)/;

function cleanText(value: string) {
  return value
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[“”‘’"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function trimAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength + 1);
  const boundary = shortened.lastIndexOf(" ");
  return shortened.slice(0, boundary >= Math.floor(maxLength * 0.65) ? boundary : maxLength).trim();
}

function finishSentence(value: string) {
  const clean = value.replace(/[,:;·…\s]+$/g, "").trim();
  if (!clean) return "";
  if (/[.!?]$/.test(clean)) return clean;
  if (QUESTION_CUE.test(clean) || /(까|나요|가요|인가요|일까요)$/.test(clean)) return `${clean}?`;
  if (COMPLETE_ENDING.test(clean)) return `${clean}.`;
  return clean;
}

function titleScore(sentence: string, index: number) {
  let score = 0;
  if (sentence.length >= 14 && sentence.length <= 64) score += 7;
  else if (sentence.length >= 8 && sentence.length <= 78) score += 3;
  if (QUESTION_CUE.test(sentence) || sentence.endsWith("?")) score += 6;
  if (CORE_CUE.test(sentence)) score += 4;
  if (COMPLETE_ENDING.test(sentence)) score += 3;
  score -= index * 0.15;
  return score;
}

export function generateCoreTitle(text: string) {
  const source = text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[“”‘’"']/g, "")
    .replace(/\r/g, "\n")
    .trim();
  if (!source) return "제목 없는 진주";

  const sentences = (source.match(/[^.!?。！？\n]+[.!?。！？]?/g) || [])
    .map(cleanText)
    .map(finishSentence)
    .filter((sentence) => sentence.length >= 4);
  const ranked = sentences
    .map((sentence, index) => ({ sentence, score: titleScore(sentence, index) }))
    .sort((a, b) => b.score - a.score || b.sentence.length - a.sentence.length);
  const selected = ranked[0]?.sentence || cleanText(source);
  if (selected.length <= 64) return finishSentence(selected);

  const completePrefix = selected.slice(0, 64).match(/^(.{8,63}(?:다|요|죠|까|나요|가요|인가요|일까요))[.!?]?/)?.[1];
  if (completePrefix) return finishSentence(completePrefix);
  return finishSentence(trimAtWord(selected, 61));
}

export function normalizeGeneratedTitle(candidate: unknown, sourceText: string) {
  const clean = cleanText(String(candidate || ""))
    .replace(/^(제목|title)\s*[:：-]\s*/i, "")
    .replace(/^[-#*\s]+/, "")
    .trim();
  if (clean.length < 4 || clean.length > 64 || !COMPLETE_ENDING.test(clean)) {
    return generateCoreTitle(sourceText);
  }
  return finishSentence(clean);
}
