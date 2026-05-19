/**
 * Mock task extraction — placeholder for future DeepSeek integration.
 * Returns deterministic fake candidates so the frontend can test the
 * full request → response flow without a real AI model.
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

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `be-mock-${Date.now()}-${idCounter}`;
}

function splitIntoSegments(text: string): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

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

function extractTimeFromText(
  text: string,
): { hour: number; minute: number } | null {
  const m = text.match(
    /(?:下午|晚上|傍晚|上午|早上)?\s*(\d{1,2})\s*[：:](\d{2})/,
  );
  if (m) {
    let h = parseInt(m[1]);
    if (/下午|晚上|傍晚/.test(text) && h < 12) h += 12;
    return { hour: h, minute: parseInt(m[2]) };
  }
  const hm = text.match(/(?:下午|晚上|傍晚|上午|早上)?\s*(\d{1,2})\s*点/);
  if (hm) {
    let h = parseInt(hm[1]);
    if (/下午|晚上|傍晚/.test(text) && h < 12) h += 12;
    return { hour: h, minute: 0 };
  }
  return null;
}

function parseDateInfo(
  text: string,
): { dueText: string; dueAt: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // -- Full date: 5.15 / 5/15 / 5月15日 --
  let month: number | null = null;
  let day: number | null = null;

  const ds = text.match(/^(\d{1,2})\s*[./]\s*(\d{1,2})/);
  if (ds) {
    const m = parseInt(ds[1]);
    const d = parseInt(ds[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      month = m;
      day = d;
    }
  }

  if (month === null) {
    const nm = text.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
    if (nm) {
      const m = parseInt(nm[1]);
      const d = parseInt(nm[2]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        month = m;
        day = d;
      }
    }
  }

  if (month !== null && day !== null) {
    const time = extractTimeFromText(text);
    const dueDate = new Date(today.getFullYear(), month - 1, day);
    const label = `${month}月${day}日`;
    if (time) {
      dueDate.setHours(time.hour, time.minute, 0, 0);
      return {
        dueText: `${label} ${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`,
        dueAt: dueDate.toISOString(),
      };
    }
    dueDate.setHours(23, 59, 0, 0);
    return { dueText: label, dueAt: dueDate.toISOString() };
  }

  // -- Relative date --
  const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
  let daysFromNow: number | null = null;
  let label = "";

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
    const nw = text.match(new RegExp(`^下周[${WEEKDAY_NAMES.join("")}]`));
    if (nw) {
      const dayIdx = WEEKDAY_NAMES.indexOf(nw[0].slice(2));
      if (dayIdx !== -1) {
        const cur = today.getDay();
        daysFromNow = dayIdx - cur + (dayIdx <= cur ? 14 : 7);
        label = "下周" + WEEKDAY_NAMES[dayIdx];
      }
    } else {
      const wdm = text.match(
        new RegExp(`^[周星期][${WEEKDAY_NAMES.join("")}]`),
      );
      if (wdm) {
        const dayIdx = WEEKDAY_NAMES.indexOf(wdm[0].slice(1));
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
      label += ` ${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
    } else {
      dueDate.setHours(23, 59, 0, 0);
    }
    return { dueText: label, dueAt: dueDate.toISOString() };
  }

  // -- Time-only (default today) --
  const time = extractTimeFromText(text);
  if (time) {
    const dueDate = new Date(today);
    dueDate.setHours(time.hour, time.minute, 0, 0);
    return {
      dueText: `今天 ${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`,
      dueAt: dueDate.toISOString(),
    };
  }

  return null;
}

function cleanTitle(segment: string): string {
  let title = segment;
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
  return title || segment;
}

function computeConfidence(text: string, hasDate: boolean): number {
  if (hasDate) return 0.85;
  if (/[会要去到做买看找取送交联系]/.test(text)) return 0.75;
  if (text.length > 8) return 0.65;
  if (text.length <= 5) return 0.5;
  return 0.6;
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

  const tasks: ExtractedTask[] = segments.map((segment) => {
    const dateInfo = parseDateInfo(segment);
    const title = cleanTitle(segment);

    return {
      title,
      sourceText: segment,
      dueText: dateInfo?.dueText,
      dueAt: dateInfo?.dueAt,
      priority: /紧急|urgent|high/i.test(segment)
        ? "high"
        : /稍后|low|minor/i.test(segment)
          ? "low"
          : "none",
      tags: [],
      timeConfidence: dateInfo?.dueAt ? "medium" : "none",
      confidence: computeConfidence(segment, !!dateInfo),
    };
  });

  return { tasks };
}
