import { Extractor } from "./types";
import { ExtractedTask, ExtractionResult } from "@/types/extraction";
import { TaskPriority } from "@/types/task";

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
const CN_DIGITS: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
  廿: 20,
};
const CN_NUMBER_PATTERN = "[零〇一二两三四五六七八九十廿]+";
const SOURCE_HEADER_PATTERN =
  /^(subject|from|to|date|cc|bcc|发件人|收件人|抄送|主题|日期)\s*[:：]/i;
const URL_ONLY_PATTERN = /^https?:\/\/\S+$/i;
const ACTION_HINT_PATTERN = /[会要去到做买看找取送交联系确认提交完成处理整理准备预约回复玩写吃读]/;

// -- Helpers -----------------------------------------------------------------

function parseChineseNumber(s: string): number | null {
  if (s in CN_DIGITS) return CN_DIGITS[s];
  const normalized = s.replace(/两/g, "二");
  const tens = normalized.match(/^十([一二三四五六七八九])?$/);
  if (tens) return 10 + (tens[1] ? CN_DIGITS[tens[1]] : 0);
  const twenties = normalized.match(/^二十([一二三四五六七八九])?$/);
  if (twenties) return 20 + (twenties[1] ? CN_DIGITS[twenties[1]] : 0);
  const thirties = normalized.match(/^三十([一二三四五六七八九])?$/);
  if (thirties) return 30 + (thirties[1] ? CN_DIGITS[thirties[1]] : 0);
  return null;
}

function parseHourValue(value: string): number | null {
  if (/^\d{1,2}$/.test(value)) return parseInt(value, 10);
  return parseChineseNumber(value);
}

function normalizeHour(hour: number, text: string): number {
  if (/凌晨/.test(text)) return hour === 12 ? 0 : hour;
  if (/中午/.test(text)) return hour < 11 ? hour + 12 : hour;
  if (/下午|晚上|傍晚|今晚|明晚/.test(text) && hour < 12) return hour + 12;
  return hour;
}

function extractTimeFromText(
  text: string
): { hour: number; minute: number } | null {
  const timeMatch = text.match(
    /(?:凌晨|下午|晚上|傍晚|上午|早上|中午)?\s*(\d{1,2})\s*[：:](\d{2})/
  );
  if (timeMatch) {
    let h = normalizeHour(parseInt(timeMatch[1]), text);
    const m = parseInt(timeMatch[2]);
    return { hour: h, minute: m };
  }
  const hourMatch = text.match(
    new RegExp(
      `(?:凌晨|下午|晚上|傍晚|上午|早上|中午|今晚|明早|明晚)?\\s*(\\d{1,2}|${CN_NUMBER_PATTERN})\\s*点\\s*(半|一刻|三刻|\\d{1,2}|${CN_NUMBER_PATTERN})?`
    )
  );
  if (hourMatch) {
    const parsedHour = parseHourValue(hourMatch[1]);
    if (parsedHour === null || parsedHour > 24) return null;

    const minuteText = hourMatch[2];
    let minute = 0;
    if (minuteText === "半") minute = 30;
    else if (minuteText === "一刻") minute = 15;
    else if (minuteText === "三刻") minute = 45;
    else if (minuteText) {
      const parsedMinute = parseHourValue(minuteText);
      minute = parsedMinute === null ? 0 : Math.max(0, Math.min(59, parsedMinute));
    }

    return { hour: normalizeHour(parsedHour, text), minute };
  }
  return null;
}

// -- Date parsing -----------------------------------------------------------

function parseDateInfo(
  text: string
): { dueText: string; dueAt?: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // -- Phase 1: Full date (5.15, 5/15, 5月15日, 五月十五日) ----------------

  let month: number | null = null;
  let day: number | null = null;
  let fullDateStr = "";

  // 5.15 / 5/15  (先验证，避免把 15 当成时间)
  const dotSlash = text.match(/^(\d{1,2})\s*[./]\s*(\d{1,2})/);
  if (dotSlash) {
    const m = parseInt(dotSlash[1]);
    const d = parseInt(dotSlash[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      month = m;
      day = d;
      fullDateStr = `${m}月${d}日`;
    }
  }

  // 5月15日 / 5月15
  if (month === null) {
    const numMD = text.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
    if (numMD) {
      const m = parseInt(numMD[1]);
      const d = parseInt(numMD[2]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        month = m;
        day = d;
        fullDateStr = `${m}月${d}日`;
      }
    }
  }

  // 五月十五日 / 五月十五
  if (month === null) {
    const cnMD = text.match(
      /^([一二三四五六七八九十廿]+)\s*月\s*([一二三四五六七八九十廿]+)\s*日?/
    );
    if (cnMD) {
      const m = parseChineseNumber(cnMD[1]);
      const d = parseChineseNumber(cnMD[2]);
      if (m !== null && d !== null && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        month = m;
        day = d;
        fullDateStr = `${m}月${d}日`;
      }
    }
  }

  if (month !== null && day !== null) {
    const time = extractTimeFromText(text);
    const dueDate = new Date(today.getFullYear(), month - 1, day);
    let label = fullDateStr;
    if (time) {
      dueDate.setHours(time.hour, time.minute, 0, 0);
      label += ` ${String(time.hour).padStart(2, "0")}:${String(
        time.minute
      ).padStart(2, "0")}`;
    } else {
      dueDate.setHours(23, 59, 0, 0);
    }
    return { dueText: label, dueAt: dueDate.toISOString() };
  }

  // -- Phase 2: Relative date ----------------------------------------------

  let daysFromNow: number | null = null;
  let label = "";
  const wd = WEEKDAY_NAMES.join("");

  // 今天 / 今晚
  if (/^今[天日晚]/.test(text)) {
    daysFromNow = 0;
    label = "今天";
  } else if (/^明[天日]/.test(text)) {
    daysFromNow = 1;
    label = "明天";
  } else if (/^后[天日]/.test(text)) {
    daysFromNow = 2;
    label = "后天";
  } else if (/^大后天/.test(text)) {
    daysFromNow = 3;
    label = "大后天";
  } else {
    // 下周一 ~ 下周日
    const nw = text.match(new RegExp(`^下周[${wd}]`));
    if (nw) {
      const dayChar = nw[0].slice(2);
      const dayIdx = WEEKDAY_NAMES.indexOf(dayChar);
      if (dayIdx !== -1) {
        const cur = today.getDay();
        daysFromNow = dayIdx - cur + (dayIdx <= cur ? 14 : 7);
        label = "下周" + WEEKDAY_NAMES[dayIdx];
      }
    } else {
      // 周一 ~ 周日 (本周)
      const wdm = text.match(new RegExp(`^[周星期][${wd}]`));
      if (wdm) {
        const dayChar = wdm[0].slice(1);
        const dayIdx = WEEKDAY_NAMES.indexOf(dayChar);
        if (dayIdx !== -1) {
          const cur = today.getDay();
          daysFromNow = dayIdx - cur + (dayIdx <= cur ? 7 : 0);
          label = "周" + WEEKDAY_NAMES[dayIdx];
        }
      }
    }
  }

  if (daysFromNow !== null) {
    const time = extractTimeFromText(text);
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    if (time) {
      dueDate.setHours(time.hour, time.minute, 0, 0);
      label += ` ${String(time.hour).padStart(2, "0")}:${String(
        time.minute
      ).padStart(2, "0")}`;
    } else {
      dueDate.setHours(23, 59, 0, 0);
    }
    return { dueText: label, dueAt: dueDate.toISOString() };
  }

  // -- Phase 3: Time-only (默认今天) ---------------------------------------

  const time = extractTimeFromText(text);
  if (time) {
    const dueDate = new Date(today);
    dueDate.setHours(time.hour, time.minute, 0, 0);
    const label = `今天 ${String(time.hour).padStart(2, "0")}:${String(
      time.minute
    ).padStart(2, "0")}`;
    return { dueText: label, dueAt: dueDate.toISOString() };
  }

  return null;
}

function detectPriority(text: string): TaskPriority {
  if (/紧急|重要\s|urgent|high.priority/i.test(text)) return "high";
  if (/稍后|low|nice.to.have|minor/i.test(text)) return "low";
  return "none";
}

// -- Title cleaning ---------------------------------------------------------

function cleanTitle(segment: string): string {
  let title = segment;

  // 移除相对日期前缀
  title = title
    .replace(
      /^(?:明天|今天|今晚|明早|明晚|后天|大后天|下周[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日])\s*/,
      ""
    )
    .trim();

  // 移除 "5.15" / "5/15" 格式日期
  title = title.replace(/^\d{1,2}\s*[./]\s*\d{1,2}\s*/, "").trim();

  // 移除中文数字日期如 "五月十五日"
  title = title
    .replace(
      /^[一二三四五六七八九十廿]+\s*月\s*[一二三四五六七八九十廿]+\s*日?\s*/,
      ""
    )
    .trim();

  // 移除时间 (HH:MM)
  title = title
    .replace(
      /(?:下午|晚上|傍晚|上午|早上)?\s*\d{1,2}\s*[：:]\s*\d{2}\s*/,
      ""
    )
    .trim();

  // 移除时间 (X点)
  title = title
    .replace(
      new RegExp(
        `(?:凌晨|下午|晚上|傍晚|上午|早上|中午|今晚|明早|明晚)?\\s*(?:\\d{1,2}|${CN_NUMBER_PATTERN})\\s*点(?:半|一刻|三刻|钟|\\d{1,2}|${CN_NUMBER_PATTERN})?\\s*`
      ),
      ""
    )
    .trim();

  // 移除完整年份日期
  title = title
    .replace(
      /\d{4}\s*[-/年]\s*\d{1,2}\s*[-/月]\s*\d{1,2}\s*日?\s*/,
      ""
    )
    .trim();

  // 移除月日格式 (5月15日 / 5月15)
  title = title.replace(/\d{1,2}\s*月\s*\d{1,2}\s*日?\s*/, "").trim();

  // 移除优先级标记
  title = title
    .replace(/[（(]\s*(?:紧急|重要|urgent|high)\s*[）)]/g, "")
    .replace(/^(前|之前|以前|内|之内)\s*/, "")
    .trim();

  return title || segment;
}

// -- Segmentation -----------------------------------------------------------

/**
 * Split raw input text into candidate task segments, supporting:
 * - single sentences
 * - multi-line (one task per line)
 * - numbered lists (1. / 1、 / 1） inline or multi-line)
 * - bullet lists (- / *)
 */
function splitIntoSegments(text: string): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !SOURCE_HEADER_PATTERN.test(l));

  const segments: string[] = [];

  for (const line of lines) {
    // Inline numbered list: e.g. "1. 交报告 2. 联系老师 3. 买牛奶"
    if (/^\d+[.、）)].*\d+[.、）)]/.test(line)) {
      const parts = line.split(/(?=\d+[.、）)])/).filter((p) => /\S/.test(p));
      for (const part of parts) {
        const cleaned = part.replace(/^\d+[.、）)]\s*/, "").trim();
        if (cleaned.length >= 2) segments.push(cleaned);
      }
      continue;
    }

    // Single numbered item: "1. 交报告"
    const numbered = line.match(/^\d+[.、）)]\s*(.+)/);
    if (numbered) {
      const content = numbered[1].trim();
      if (content.length >= 2) segments.push(content);
      continue;
    }

    // Bullet item: "- 交报告" or "* 交报告"
    const bullet = line.match(/^[-*]\s*(.+)/);
    if (bullet) {
      const content = bullet[1].trim();
      if (content.length >= 2) segments.push(content);
      continue;
    }

    // Plain line
    if (line.length >= 2) segments.push(line);
  }

  return segments;
}

// -- Confidence -------------------------------------------------------------

function computeConfidence(text: string, hasDate: boolean): number {
  if (hasDate) return 0.85;
  if (/[会要去到做买看找取送交联系]/.test(text)) return 0.75;
  if (text.length > 8) return 0.65;
  if (text.length <= 5) return 0.5;
  return 0.6;
}

function isActionableSegment(text: string, hasDate: boolean): boolean {
  if (hasDate) return true;
  if (URL_ONLY_PATTERN.test(text.trim())) return false;
  return ACTION_HINT_PATTERN.test(text);
}

// -- Task ID ----------------------------------------------------------------

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `ext-${Date.now()}-${idCounter}`;
}

// -- Extractor --------------------------------------------------------------

export class MockExtractor implements Extractor {
  readonly name = "mock";

  async extract(text: string): Promise<ExtractionResult> {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));

    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) {
      return { tasks: [], rawText: text };
    }

    const segments = splitIntoSegments(trimmed);
    if (segments.length === 0) {
      return { tasks: [], rawText: text };
    }

    const tasks: ExtractedTask[] = segments.flatMap((segment) => {
        const dateInfo = parseDateInfo(segment);
        if (!isActionableSegment(segment, !!dateInfo)) return [];

        const title = cleanTitle(segment);
        const confidence = computeConfidence(segment, !!dateInfo);

        const task: ExtractedTask = {
          id: nextId(),
          title,
          sourceText: segment,
          dueText: dateInfo?.dueText,
          dueAt: dateInfo?.dueAt,
          priority: detectPriority(segment),
          tags: [],
          timeConfidence: dateInfo?.dueAt ? "medium" : "none",
          timeStatus: dateInfo?.dueText ? "needs_review" : "none",
          confidence,
        };
        return [task];
      });

    return { tasks, rawText: text };
  }

  async extractFromImage(imageBase64: string): Promise<ExtractionResult & { ocrText: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const ocrText = "明天下午3点前联系老师确认论文题目\n下周五提交报告";
    
    return {
      ocrText,
      rawText: ocrText,
      tasks: [
        {
          id: nextId(),
          title: "联系老师确认论文题目",
          sourceText: ocrText,
          dueAt: undefined,
          dueText: "明天下午3点前",
          notes: undefined,
          timeStatus: "needs_review",
          timeConfidence: "medium",
          priority: "none",
          tags: [],
          confidence: 0.95,
        },
        {
          id: nextId(),
          title: "提交报告",
          sourceText: ocrText,
          dueAt: undefined,
          dueText: "下周五",
          notes: undefined,
          timeStatus: "needs_review",
          timeConfidence: "medium",
          priority: "none",
          tags: [],
          confidence: 0.9,
        },
      ],
    };
  }
}
