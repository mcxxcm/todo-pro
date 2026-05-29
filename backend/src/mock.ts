import {
  parseChineseDateInfo,
  stripChineseTimeExpressions,
} from "./time/parseChineseTime";

/**
 * Mock task extraction — offline fallback when DeepSeek is not configured.
 * Returns deterministic candidates extracted from Chinese natural language
 * text using regex-based parsing, enabling the full request → response
 * flow without a real AI model.
 */

interface ExtractedTask {
  title: string;
  sourceText: string;
  dueText?: string;
  dueAt?: string;
  priority: "none" | "low" | "medium" | "high";
  tags: string[];
  notes?: string;
  timeConfidence: "high" | "medium" | "low" | "none";
  confidence?: number;
}

const SOURCE_HEADER_PATTERN =
  /^(subject|from|to|date|cc|bcc|发件人|收件人|抄送|主题|日期)\s*[:：]/i;
const URL_ONLY_PATTERN = /^https?:\/\/\S+$/i;
const ACTION_HINT_PATTERN = /[会要去到做买看找取送交联系确认提交完成处理整理准备预约回复玩写吃读]/;

function splitIntoSegments(text: string): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1)
    .filter((l) => !SOURCE_HEADER_PATTERN.test(l));

  const segments: string[] = [];

  for (const line of lines) {
    // Inline numbered list: "1. 交报告 2. 联系老师"
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
      segments.push(numbered[1].trim());
      continue;
    }

    // Bullet item
    const bullet = line.match(/^[-*]\s*(.+)/);
    if (bullet) {
      segments.push(bullet[1].trim());
      continue;
    }

    // Plain line
    segments.push(line);
  }

  return segments;
}

function cleanTitle(segment: string): string {
  let title = stripChineseTimeExpressions(segment);
  title = title
    .replace(
      /^(?:明天|今天|今晚|明早|明晚|后天|大后天|下周[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日])\s*/,
      "",
    )
    .trim();
  title = title.replace(/^\d{1,2}\s*[./]\s*\d{1,2}\s*/, "").trim();
  title = title
    .replace(/(?:下午|晚上|傍晚|上午|早上)?\s*\d{1,2}\s*[：:]\s*\d{2}\s*/, "")
    .trim();
  title = title
    .replace(/(?:下午|晚上|傍晚|上午|早上)?\s*\d{1,2}\s*点(?:半|钟)?\s*/, "")
    .trim();
  title = title
    .replace(/\d{1,2}\s*月\s*\d{1,2}\s*日?\s*/, "")
    .trim();
  title = title
    .replace(/[（(]\s*(?:紧急|重要|urgent|high)\s*[）)]/g, "")
    .trim();
  return title || stripChineseTimeExpressions(segment) || segment;
}

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

const TAG_RULES: [RegExp, string][] = [
  [/作业|考试|论文|复习|预习|课|学习|教材|老师/, "学习"],
  [/工作|会议|汇报|报告|项目|客户|同事|办公/, "工作"],
  [/买|购|超市|商场|淘宝|快递|下单/, "购物"],
  [/锻炼|跑步|健身|医院|体检|吃药|看病/, "健康"],
  [/朋友|聚餐|约|见面|电话|微信|联系/, "社交"],
  [/打扫|洗衣|做饭|收拾|修理|缴费|水电/, "家务"],
];

function inferTags(text: string): string[] {
  const tags: string[] = [];
  for (const [pattern, tag] of TAG_RULES) {
    if (pattern.test(text)) {
      tags.push(tag);
    }
  }
  return tags;
}

function inferNotes(segment: string, title: string): string | undefined {
  // Only generate notes if the source text has more context than the title
  if (segment.length <= title.length + 5) return undefined;
  const trimmedSource = segment.trim();
  if (trimmedSource === title) return undefined;
  return `来源: ${trimmedSource}`;
}

export function mockExtract(text: string): { tasks: ExtractedTask[] } {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3) {
    return { tasks: [] };
  }

  const segments = splitIntoSegments(trimmed);
  if (segments.length === 0) {
    return { tasks: [] };
  }

  const tasks: ExtractedTask[] = segments.flatMap((segment) => {
      const dateInfo = parseChineseDateInfo(segment);
      if (!isActionableSegment(segment, !!dateInfo)) return [];

      const title = cleanTitle(segment);

      const task: ExtractedTask = {
        title,
        sourceText: segment,
        dueText: dateInfo?.dueText,
        dueAt: dateInfo?.dueAt,
        priority: /紧急|urgent|high/i.test(segment)
          ? "high"
          : /稍后|low|minor/i.test(segment)
            ? "low"
            : "none",
        tags: inferTags(segment),
        notes: inferNotes(segment, title),
        timeConfidence: dateInfo?.dueAt ? "medium" : "none",
        confidence: computeConfidence(segment, !!dateInfo),
      };
      return [task];
    });

  return { tasks };
}
