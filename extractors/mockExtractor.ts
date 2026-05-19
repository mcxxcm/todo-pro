import { Extractor } from "./types";
import { ExtractedTask, ExtractionResult } from "@/types/extraction";
import { TimeConfidence, TaskPriority } from "@/types/task";

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

// -- Date parsing -----------------------------------------------------------

function parseDateInfo(
  text: string
): { dueText: string; dueAt?: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

  if (daysFromNow === null) return null;

  // 提取时间
  let hour: number | null = null;
  let minute = 0;

  const timeMatch = text.match(
    /(?:下午|晚上|傍晚|上午|早上)?\s*(\d{1,2})\s*[：:](\d{2})/
  );
  if (timeMatch) {
    hour = parseInt(timeMatch[1]);
    minute = parseInt(timeMatch[2]);
    if (/下午|晚上|傍晚/.test(text) && hour < 12) hour += 12;
  } else {
    const hourMatch = text.match(
      /(?:下午|晚上|傍晚|上午|早上)?\s*(\d{1,2})\s*点/
    );
    if (hourMatch) {
      hour = parseInt(hourMatch[1]);
      if (/下午|晚上|傍晚/.test(text) && hour < 12) hour += 12;
    }
  }

  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + daysFromNow);

  if (hour !== null) {
    dueDate.setHours(hour, minute, 0, 0);
    label += ` ${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  } else {
    dueDate.setHours(23, 59, 0, 0);
  }

  return { dueText: label, dueAt: dueDate.toISOString() };
}

function detectPriority(text: string): TaskPriority {
  if (/紧急|重要\s|urgent|high.priority/i.test(text)) return "high";
  if (/稍后|low|nice.to.have|minor/i.test(text)) return "low";
  return "none";
}

// -- Title cleaning ---------------------------------------------------------

function cleanTitle(segment: string): string {
  let title = segment;
  title = title
    .replace(
      /^(?:明天|今天|今晚|明早|明晚|后天|大后天|下周[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日])\s*/,
      ""
    )
    .trim();
  title = title
    .replace(
      /(?:下午|晚上|傍晚|上午|早上)?\s*\d{1,2}\s*[：:]\s*\d{2}\s*/,
      ""
    )
    .trim();
  title = title
    .replace(/(?:下午|晚上|傍晚|上午|早上)?\s*\d{1,2}\s*点(?:半|钟)?\s*/, "")
    .trim();
  title = title
    .replace(/\d{4}\s*[-/年]\s*\d{1,2}\s*[-/月]\s*\d{1,2}\s*日?\s*/, "")
    .trim();
  title = title.replace(/\d{1,2}\s*月\s*\d{1,2}\s*日\s*/, "").trim();
  title = title
    .replace(/[（(]\s*(?:紧急|重要|urgent|high)\s*[）)]/g, "")
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
    .filter((l) => l.length > 0);

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

    const tasks: ExtractedTask[] = segments.map((segment) => {
      const dateInfo = parseDateInfo(segment);
      const title = cleanTitle(segment);
      const confidence = computeConfidence(segment, !!dateInfo);

      return {
        id: nextId(),
        title,
        sourceText: segment,
        dueText: dateInfo?.dueText,
        dueAt: dateInfo?.dueAt,
        priority: detectPriority(segment),
        tags: [],
        timeConfidence: dateInfo?.dueAt ? "medium" : "none",
        needsConfirmation: true,
        confidence,
      };
    });

    return { tasks, rawText: text };
  }
}
