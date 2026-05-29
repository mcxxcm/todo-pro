export interface ParsedChineseDateInfo {
  dueText: string;
  dueAt: string;
  matchedText: string;
  matchedParts: string[];
}

interface TimeOfDay {
  hour: number;
  minute: number;
  matchedText: string;
}

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
const CHINESE_NUMBER_CHARS = "零〇一二两三四五六七八九十廿";
const NUMBER_PATTERN = `(?:\\d{1,4}|[${CHINESE_NUMBER_CHARS}]+)`;

const CHINESE_DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

function parseInteger(value: string): number | null {
  if (/^\d+$/.test(value)) return parseInt(value, 10);

  if (/^[零〇一二两三四五六七八九]+$/.test(value) && value.length >= 3) {
    return Number(
      value
        .split("")
        .map((char) => CHINESE_DIGITS[char])
        .join(""),
    );
  }

  if (value === "十") return 10;
  if (value === "廿") return 20;

  const normalized = value.replace(/两/g, "二");

  if (normalized.startsWith("廿")) {
    const ones = normalized.slice(1);
    return 20 + (ones ? (CHINESE_DIGITS[ones] ?? 0) : 0);
  }

  const tenIndex = normalized.indexOf("十");
  if (tenIndex !== -1) {
    const tensPart = normalized.slice(0, tenIndex);
    const onesPart = normalized.slice(tenIndex + 1);
    const tens = tensPart ? CHINESE_DIGITS[tensPart] : 1;
    const ones = onesPart ? CHINESE_DIGITS[onesPart] : 0;
    if (tens === undefined || ones === undefined) return null;
    return tens * 10 + ones;
  }

  if (normalized.length === 1) return CHINESE_DIGITS[normalized] ?? null;

  return null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0);
}

function toChineseWeekIndex(day: number): number {
  return day === 0 ? 7 : day;
}

function maybeRollToFuture(date: Date, reference: Date): Date {
  const candidate = new Date(date);
  if (candidate.getTime() < startOfDay(reference).getTime()) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }
  return candidate;
}

function applyTime(date: Date, time: TimeOfDay | null): Date {
  const result = new Date(date);
  if (time) {
    result.setHours(time.hour, time.minute, 0, 0);
  } else {
    result.setHours(23, 59, 0, 0);
  }
  return result;
}

function normalizeHour(hour: number, periodText: string): number {
  if (/凌晨/.test(periodText)) {
    return hour === 12 ? 0 : hour;
  }
  if (/中午/.test(periodText)) {
    return hour < 11 ? hour + 12 : hour;
  }
  if (/下午|傍晚|晚上|今晚|明晚/.test(periodText) && hour < 12) {
    return hour + 12;
  }
  return hour;
}

function parseMinute(value: string | undefined): number {
  if (!value) return 0;
  if (value === "半") return 30;
  if (value === "一刻") return 15;
  if (value === "三刻") return 45;

  const normalized = value.replace(/分|分钟/g, "");
  const parsed = parseInteger(normalized);
  return parsed === null ? 0 : Math.max(0, Math.min(59, parsed));
}

function parseTimeOfDay(text: string): TimeOfDay | null {
  const numericTime = text.match(
    /(凌晨|早上|上午|中午|下午|傍晚|晚上|今晚|明早|明晚)?\s*(\d{1,2})\s*[：:]\s*(\d{1,2})/,
  );
  if (numericTime) {
    const period = numericTime[1] ?? "";
    const hour = normalizeHour(parseInt(numericTime[2], 10), period);
    const minute = Math.max(0, Math.min(59, parseInt(numericTime[3], 10)));
    return { hour, minute, matchedText: numericTime[0].trim() };
  }

  const hourTime = text.match(
    new RegExp(
      `(凌晨|早上|上午|中午|下午|傍晚|晚上|今晚|明早|明晚)?\\s*(${NUMBER_PATTERN})\\s*点\\s*(半|一刻|三刻|${NUMBER_PATTERN}(?:分|分钟)?)?`,
    ),
  );
  if (hourTime) {
    const period = hourTime[1] ?? "";
    const parsedHour = parseInteger(hourTime[2]);
    if (parsedHour === null || parsedHour > 24) return null;
    const hour = normalizeHour(parsedHour, period);
    const minute = parseMinute(hourTime[3]);
    return { hour, minute, matchedText: hourTime[0].trim() };
  }

  const periodOnly = text.match(/凌晨|早上|上午|中午|下午|傍晚|晚上|今晚|明早|明晚/);
  if (!periodOnly) return null;

  const period = periodOnly[0];
  const defaults: Record<string, { hour: number; minute: number }> = {
    凌晨: { hour: 6, minute: 0 },
    早上: { hour: 9, minute: 0 },
    上午: { hour: 9, minute: 0 },
    中午: { hour: 12, minute: 0 },
    下午: { hour: 15, minute: 0 },
    傍晚: { hour: 18, minute: 0 },
    晚上: { hour: 20, minute: 0 },
    今晚: { hour: 20, minute: 0 },
    明早: { hour: 9, minute: 0 },
    明晚: { hour: 20, minute: 0 },
  };

  return {
    ...defaults[period],
    matchedText: period,
  };
}

function formatTime(time: TimeOfDay | null): string {
  if (!time) return "";
  return ` ${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
}

function buildResult(
  date: Date,
  label: string,
  dateMatchedText: string,
  time: TimeOfDay | null,
): ParsedChineseDateInfo {
  const dueDate = applyTime(date, time);
  const matchedParts =
    time?.matchedText && time.matchedText.includes(dateMatchedText)
      ? [time.matchedText]
      : [dateMatchedText];
  if (
    time?.matchedText &&
    !dateMatchedText.includes(time.matchedText) &&
    !time.matchedText.includes(dateMatchedText)
  ) {
    matchedParts.push(time.matchedText);
  }

  return {
    dueText: `${label}${formatTime(time)}`,
    dueAt: dueDate.toISOString(),
    matchedText: matchedParts.join(" "),
    matchedParts,
  };
}

function parseExplicitDate(
  text: string,
  reference: Date,
  time: TimeOfDay | null,
): ParsedChineseDateInfo | null {
  const fullDate = text.match(
    new RegExp(
      `(20\\d{2}|[零〇一二三四五六七八九]{4})\\s*[-/.年]\\s*(${NUMBER_PATTERN})\\s*[-/.月]\\s*(${NUMBER_PATTERN})\\s*(?:日|号)?`,
    ),
  );
  if (fullDate) {
    const year = parseInteger(fullDate[1]);
    const month = parseInteger(fullDate[2]);
    const day = parseInteger(fullDate[3]);
    if (year && month && day && month <= 12 && day <= 31) {
      const date = new Date(year, month - 1, day);
      return buildResult(date, `${year}年${month}月${day}日`, fullDate[0], time);
    }
  }

  const monthDay = text.match(
    new RegExp(`(${NUMBER_PATTERN})\\s*月\\s*(${NUMBER_PATTERN})\\s*(?:日|号)?`),
  );
  if (monthDay) {
    const month = parseInteger(monthDay[1]);
    const day = parseInteger(monthDay[2]);
    if (month && day && month <= 12 && day <= 31) {
      const date = maybeRollToFuture(
        new Date(reference.getFullYear(), month - 1, day),
        reference,
      );
      return buildResult(date, `${month}月${day}日`, monthDay[0], time);
    }
  }

  return null;
}

function parseRelativeDuration(
  text: string,
  reference: Date,
): ParsedChineseDateInfo | null {
  const duration = text.match(
    new RegExp(`(半|${NUMBER_PATTERN})\\s*(分钟|小时|天|日|周|星期|个月)\\s*(?:后|以后|之内|内)`),
  );
  if (!duration) return null;

  const amount = duration[1] === "半" ? 0.5 : parseInteger(duration[1]);
  if (amount === null) return null;

  const unit = duration[2];
  const dueDate = new Date(reference);

  if (unit === "分钟") dueDate.setMinutes(dueDate.getMinutes() + amount);
  if (unit === "小时") dueDate.setTime(dueDate.getTime() + amount * 60 * 60 * 1000);
  if (unit === "天" || unit === "日") dueDate.setDate(dueDate.getDate() + amount);
  if (unit === "周" || unit === "星期") dueDate.setDate(dueDate.getDate() + amount * 7);
  if (unit === "个月") dueDate.setMonth(dueDate.getMonth() + amount);

  return {
    dueText: duration[0],
    dueAt: dueDate.toISOString(),
    matchedText: duration[0],
    matchedParts: [duration[0]],
  };
}

function parseRelativeDay(
  text: string,
  reference: Date,
  time: TimeOfDay | null,
): ParsedChineseDateInfo | null {
  const relativeDay = text.match(
    /大后天|后天|明天|明日|明早|明晚|今天|今日|今儿|今晚|今早|昨天|昨日/,
  );
  if (!relativeDay) return null;

  const matched = relativeDay[0];
  const offsets: Record<string, number> = {
    昨天: -1,
    昨日: -1,
    今天: 0,
    今日: 0,
    今儿: 0,
    今晚: 0,
    今早: 0,
    明天: 1,
    明日: 1,
    明早: 1,
    明晚: 1,
    后天: 2,
    大后天: 3,
  };

  const date = startOfDay(reference);
  date.setDate(date.getDate() + offsets[matched]);
  const label =
    matched === "明早" || matched === "明晚"
      ? "明天"
      : matched === "今晚" || matched === "今早"
        ? "今天"
        : matched;

  return buildResult(date, label, matched, time);
}

function parseWeekday(
  text: string,
  reference: Date,
  time: TimeOfDay | null,
): ParsedChineseDateInfo | null {
  const weekday = text.match(
    /(?:(上|下|本|这)(?:个)?(?:周|星期|礼拜)|(?:周|星期|礼拜))([一二三四五六日天末])/,
  );
  if (!weekday) return null;

  const prefix = weekday[1] ?? "";
  const dayText = weekday[2];
  const targetDay =
    dayText === "天" || dayText === "日" || dayText === "末"
      ? 7
      : WEEKDAY_NAMES.indexOf(dayText);
  if (targetDay === -1) return null;

  const date = startOfDay(reference);
  const currentDay = toChineseWeekIndex(date.getDay());
  let daysFromNow = targetDay - currentDay;

  if (prefix === "上") {
    daysFromNow -= 7;
  } else if (prefix === "下") {
    daysFromNow += 7;
  } else if (!prefix && daysFromNow <= 0) {
    daysFromNow += 7;
  }

  date.setDate(date.getDate() + daysFromNow);

  const labelPrefix = prefix === "下" ? "下周" : prefix === "上" ? "上周" : "周";
  const label = `${labelPrefix}${dayText === "末" ? "末" : WEEKDAY_NAMES[targetDay % 7]}`;
  return buildResult(date, label, weekday[0], time);
}

function parseDayOfMonth(
  text: string,
  reference: Date,
  time: TimeOfDay | null,
): ParsedChineseDateInfo | null {
  const dayOfMonth = text.match(
    new RegExp(`(?:(下|本|这)(?:个)?月\\s*)?(${NUMBER_PATTERN})\\s*(?:日|号)`),
  );
  if (!dayOfMonth) return null;

  const prefix = dayOfMonth[1] ?? "";
  const day = parseInteger(dayOfMonth[2]);
  if (!day || day > 31) return null;

  let year = reference.getFullYear();
  let monthIndex = reference.getMonth();

  if (prefix === "下") {
    monthIndex += 1;
  }

  let date = new Date(year, monthIndex, day);
  if (!prefix && date.getTime() < startOfDay(reference).getTime()) {
    monthIndex += 1;
    date = new Date(year, monthIndex, day);
  }

  year = date.getFullYear();
  monthIndex = date.getMonth();

  return buildResult(
    date,
    `${monthIndex + 1}月${day}日`,
    dayOfMonth[0],
    time,
  );
}

function parseMonthEnd(
  text: string,
  reference: Date,
  time: TimeOfDay | null,
): ParsedChineseDateInfo | null {
  const monthEnd = text.match(/(本|这|下)?(?:个)?月\s*底|月底/);
  if (!monthEnd) return null;

  const prefix = monthEnd[1] ?? "";
  const monthIndex = reference.getMonth() + (prefix === "下" ? 1 : 0);
  const date = endOfMonth(reference.getFullYear(), monthIndex);
  const label = `${date.getMonth() + 1}月底`;
  return buildResult(date, label, monthEnd[0], time);
}

export function parseChineseDateInfo(
  text: string,
  reference: Date = new Date(),
): ParsedChineseDateInfo | null {
  const normalizedText = text.trim();
  if (!normalizedText) return null;

  const time = parseTimeOfDay(normalizedText);

  return (
    parseRelativeDuration(normalizedText, reference) ??
    parseExplicitDate(normalizedText, reference, time) ??
    parseRelativeDay(normalizedText, reference, time) ??
    parseWeekday(normalizedText, reference, time) ??
    parseMonthEnd(normalizedText, reference, time) ??
    parseDayOfMonth(normalizedText, reference, time) ??
    (time
      ? buildResult(startOfDay(reference), "今天", time.matchedText, time)
      : null)
  );
}

export function stripChineseTimeExpressions(text: string): string {
  const parsed = parseChineseDateInfo(text);
  if (!parsed) return text.trim();

  let result = text;
  for (const part of parsed.matchedParts) {
    if (!part) continue;
    result = result.replace(part, " ");
  }

  return result
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(前|之前|以前|内|之内)\s*/, "")
    .trim();
}
