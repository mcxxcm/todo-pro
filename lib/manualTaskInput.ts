import { parseClientDateInfo } from "@/lib/clientTimeParser";

export interface ParsedManualTaskInput {
  title: string;
  dueAt?: string;
  dueText?: string;
  timeStatus: "none" | "needs_review";
}

export function parseManualTaskInput(
  input: string,
  reference: Date = new Date(),
): ParsedManualTaskInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parsedDate = parseClientDateInfo(trimmed, reference);
  if (!parsedDate) {
    return {
      title: trimmed,
      timeStatus: "none",
    };
  }

  return {
    dueAt: parsedDate.dueAt,
    dueText: parsedDate.dueText,
    title: cleanManualTaskTitle(trimmed) || trimmed,
    timeStatus: "needs_review",
  };
}

function cleanManualTaskTitle(input: string): string {
  return input
    .replace(/(?:大后天|后天|后日|明天|明日|明早|明晚|今天|今日|今晚|今早)\s*/g, "")
    .replace(/(?:半|\d{1,3}|[零〇一二两三四五六七八九十廿]+)\s*(?:分钟|小时|天)\s*后\s*/g, "")
    .replace(/(?:月底|月末)(?:前)?\s*/g, "")
    .replace(/下(?:个)?月\s*(?:\d{1,2}|[零〇一二两三四五六七八九十廿]+)\s*(?:日|号)?\s*/g, "")
    .replace(/\d{4}\s*[-/年]\s*\d{1,2}\s*[-/月]\s*\d{1,2}\s*(?:日|号)?\s*/g, "")
    .replace(/(?:(?:上|下|本|这)(?:个)?(?:周|星期|礼拜)|(?:周|星期|礼拜))[一二三四五六日天末]\s*/g, "")
    .replace(/[零〇一二两三四五六七八九十廿\d]{1,3}\s*月\s*[零〇一二两三四五六七八九十廿\d]{1,3}\s*(?:日|号)?\s*/g, "")
    .replace(/(?:凌晨|下午|晚上|傍晚|上午|早上|中午|今晚|明早|明晚)?\s*\d{1,2}\s*[：:]\s*\d{1,2}\s*/g, "")
    .replace(/(?:凌晨|下午|晚上|傍晚|上午|早上|中午|今晚|明早|明晚)?\s*(?:\d{1,2}|[零〇一二两三四五六七八九十廿]+)\s*点\s*(?:半|一刻|三刻|\d{1,2}|[零〇一二两三四五六七八九十廿]+)?\s*/g, "")
    .trim();
}
