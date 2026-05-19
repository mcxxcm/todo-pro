import { Extractor } from "./types";
import { ExtractedTask, ExtractionResult } from "@/types/extraction";
import { TimeConfidence, TaskPriority } from "@/types/task";

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

function parseDateInfo(
  text: string
): { dueText: string; dueAt?: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let daysFromNow: number | null = null;
  let label = "";

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
    const nw = text.match(/^下周([" + WEEKDAY_NAMES.join("") + "])/);
    if (nw) {
      const dayIdx = WEEKDAY_NAMES.indexOf(nw[1]);
      if (dayIdx !== -1) {
        const cur = today.getDay();
        daysFromNow = dayIdx - cur + (dayIdx <= cur ? 14 : 7);
        label = "下周" + WEEKDAY_NAMES[dayIdx];
      }
    } else {
      // 周一 ~ 周日 (本周)
      const wd = text.match(/^[周星期]([" + WEEKDAY_NAMES.join("") + "])/);
      if (wd) {
        const dayIdx = WEEKDAY_NAMES.indexOf(wd[1]);
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

function cleanTitle(segment: string): string {
  let title = segment;
  // 去掉句首日期短语
  title = title
    .replace(
      /^(?:明天|今天|今晚|明早|明晚|后天|大后天|下周[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日])\s*/,
      ""
    )
    .trim();
  // 去掉时间短语
  title = title
    .replace(
      /(?:下午|晚上|傍晚|上午|早上)?\s*\d{1,2}\s*[：:]\s*\d{2}\s*/,
      ""
    )
    .trim();
  title = title
    .replace(/(?:下午|晚上|傍晚|上午|早上)?\s*\d{1,2}\s*点(?:半|钟)?\s*/, "")
    .trim();
  // 去掉日期数字
  title = title
    .replace(/\d{4}\s*[-/年]\s*\d{1,2}\s*[-/月]\s*\d{1,2}\s*日?\s*/, "")
    .trim();
  title = title
    .replace(/\d{1,2}\s*月\s*\d{1,2}\s*日\s*/, "")
    .trim();
  // 去掉优先级标记 (紧急) (重要)
  title = title.replace(/[（(]\s*(?:紧急|重要|urgent|high)\s*[）)]/g, "").trim();

  return title || segment;
}

function splitText(text: string): string[] {
  return text
    .split(/[\n;；。！？]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
}

export class MockExtractor implements Extractor {
  readonly name = "mock";

  async extract(text: string): Promise<ExtractionResult> {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));

    const segments = splitText(text);
    const tasks: ExtractedTask[] = segments.map((segment, index) => {
      const dateInfo = parseDateInfo(segment);
      const title = cleanTitle(segment);

      return {
        id: `ext-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        sourceText: segment,
        dueText: dateInfo?.dueText,
        dueAt: dateInfo?.dueAt,
        priority: detectPriority(segment),
        tags: [],
        timeConfidence: dateInfo?.dueAt ? "medium" : "none",
        needsConfirmation: true,
      };
    });

    return { tasks, rawText: text };
  }
}
