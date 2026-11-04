import { db } from "@/lib/db";

export interface QualityWarning {
  type: "DEADLINE" | "AMOUNT" | "NEGATION" | "UNCONFIRMED";
  message: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  warnings: QualityWarning[];
  glossaryApplied: string[];
  provider: string;
}

// In-memory LRU cache to avoid repeated network calls for common phrases
const translationCache = new Map<string, TranslationResult>();
const MAX_CACHE_SIZE = 1000;

export const SUPPORTED_LANGUAGES = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳", hasAsr: true, hasMt: true, hasTts: true },
  { code: "en", name: "English", flag: "🇺🇸", hasAsr: true, hasMt: true, hasTts: true },
  { code: "ja", name: "日本語 (Japanese)", flag: "🇯🇵", hasAsr: true, hasMt: true, hasTts: true },
  { code: "ko", name: "한국어 (Korean)", flag: "🇰🇷", hasAsr: true, hasMt: true, hasTts: true },
  { code: "zh", name: "中文 (Chinese)", flag: "🇨🇳", hasAsr: true, hasMt: true, hasTts: true },
  { code: "fr", name: "Français", flag: "🇫🇷", hasAsr: true, hasMt: true, hasTts: true },
  { code: "de", name: "Deutsch", flag: "🇩🇪", hasAsr: true, hasMt: true, hasTts: true },
];

/**
 * TR-21: Quality Warnings Detector
 * Flags sensitive phrases like deadlines, money, and negation to prevent misunderstandings.
 */
export function detectQualityWarnings(text: string, lang: string = "vi"): QualityWarning[] {
  const warnings: QualityWarning[] = [];
  const lower = text.toLowerCase();

  // Deadlines & Dates
  const deadlineKeywords = [
    "thứ sáu", "thứ hai", "thứ ba", "thứ tư", "thứ năm", "thứ bảy", "chủ nhật",
    "hôm nay", "ngày mai", "ngày kia", "tuần này", "tuần sau", "tháng này", "tháng sau",
    "hạn chót", "deadline", "trước ngày", "đến ngày", "friday", "monday", "tomorrow", "next week"
  ];
  if (deadlineKeywords.some((kw) => lower.includes(kw))) {
    warnings.push({
      type: "DEADLINE",
      message: "Chứa mốc thời gian / hạn chót quan trọng, vui lòng đối chiếu văn bản gốc.",
    });
  }

  // Amounts & Numbers & Currency
  const amountKeywords = [
    "triệu", "tỷ", "nghìn", "k", "usd", "vnd", "đ", "$", "đồng", "million", "billion", "dollars"
  ];
  const hasDigits = /\d+([.,]\d+)?/.test(lower);
  if (hasDigits && amountKeywords.some((kw) => lower.includes(kw))) {
    warnings.push({
      type: "AMOUNT",
      message: "Chứa số liệu / ngân sách nhạy cảm, cần kiểm tra kỹ số tiền.",
    });
  }

  // Negation (critical for contracts & agreements)
  const negationKeywords = [
    "không", "chưa", "chẳng", "đừng", "hủy", "từ chối", "bác bỏ",
    "not", "never", "no", "cancel", "reject", "cannot", "can't", "won't"
  ];
  if (negationKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lower))) {
    warnings.push({
      type: "NEGATION",
      message: "Chứa từ phủ định hoặc hủy bỏ, cần tránh hiểu ngược ý.",
    });
  }

  return warnings;
}

/**
 * Auto-detect language if not provided
 */
export function detectLanguage(text: string): string {
  // Common Vietnamese diacritics
  const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  // Japanese Kana/Kanji
  const jaRegex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/;
  // Korean Hangul
  const koRegex = /[\uac00-\ud7af]/;
  // Chinese
  const zhRegex = /[\u4e00-\u9fff]/;

  if (viRegex.test(text)) return "vi";
  if (jaRegex.test(text)) return "ja";
  if (koRegex.test(text)) return "ko";
  if (zhRegex.test(text)) return "zh";
  return "en";
}

/**
 * Main AI Translation pipeline with Glossary preservation and Quality Warnings
 */
export async function translateText({
  text,
  sourceLang,
  targetLang = "en",
  orgId,
}: {
  text: string;
  sourceLang?: string;
  targetLang?: string;
  orgId?: string;
}): Promise<TranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      originalText: text,
      translatedText: text,
      sourceLang: sourceLang || "vi",
      targetLang: targetLang || "en",
      warnings: [],
      glossaryApplied: [],
      provider: "noop",
    };
  }

  const sLang = sourceLang || detectLanguage(trimmed);
  const tLang = targetLang.toLowerCase();

  // If source and target are the same, return directly
  if (sLang === tLang) {
    return {
      originalText: trimmed,
      translatedText: trimmed,
      sourceLang: sLang,
      targetLang: tLang,
      warnings: detectQualityWarnings(trimmed, sLang),
      glossaryApplied: [],
      provider: "identity",
    };
  }

  const cacheKey = `${sLang}->${tLang}::${trimmed}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // TR-09: Fetch Glossary Terms for this org or global
  let glossaryTerms: { source: string; target: string }[] = [];
  try {
    glossaryTerms = await db.glossaryTerm.findMany({
      where: {
        ...(orgId ? { orgId } : {}),
      },
      select: {
        source: true,
        target: true,
      },
    });
  } catch (err) {
    // If DB is busy or offline, proceed without glossary
  }

  // Add default Deku enterprise glossary terms
  const defaultGlossary = [
    { source: "Deku", target: "Deku" },
    { source: "HRM", target: "HRM" },
    { source: "API payroll", target: "API payroll" },
    { source: "LiveKit", target: "LiveKit" },
    { source: "Clerk", target: "Clerk" },
    { source: "Prisma", target: "Prisma" },
  ];
  const allTerms = [...defaultGlossary, ...glossaryTerms];

  // Protect glossary terms with unique placeholders
  let textToTranslate = trimmed;
  const appliedGlossary: string[] = [];
  const replacements: { placeholder: string; targetTerm: string }[] = [];

  allTerms.forEach((term, index) => {
    const termRegex = new RegExp(`\\b${term.source}\\b`, "gi");
    if (termRegex.test(textToTranslate)) {
      const placeholder = `__DEKU_TERM_${index}__`;
      textToTranslate = textToTranslate.replace(termRegex, placeholder);
      replacements.push({ placeholder, targetTerm: term.target });
      appliedGlossary.push(term.source);
    }
  });

  // Call translation backend
  let translatedText = textToTranslate;
  let provider = "mymemory";

  try {
    const langPair = `${sLang}|${tLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      textToTranslate
    )}&langpair=${encodeURIComponent(langPair)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        translatedText = data.responseData.translatedText;
      }
    }
  } catch (err) {
    console.warn("[TranslationService] Remote translation failed, using fallback:", err);
    // Fallback: If network fails, return original with language tag
    translatedText = textToTranslate;
    provider = "fallback";
  }

  // Restore protected glossary terms
  replacements.forEach(({ placeholder, targetTerm }) => {
    const reg = new RegExp(placeholder, "g");
    translatedText = translatedText.replace(reg, targetTerm);
  });

  const warnings = detectQualityWarnings(trimmed, sLang);

  const result: TranslationResult = {
    originalText: trimmed,
    translatedText: translatedText.trim(),
    sourceLang: sLang,
    targetLang: tLang,
    warnings,
    glossaryApplied: appliedGlossary,
    provider,
  };

  // Cache result
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  translationCache.set(cacheKey, result);

  return result;
}
