const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
const CN_DIGITS: Record<string, number> = {
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
  十: 10,
  廿: 20,
};
const CN_NUMBER_PATTERN = "[零〇一二两三四五六七八九十廿]+";

export interface ClientDateInfo {
  dueText: string;
  dueAt: string;
}

function parseChineseNumber(value: string): number | null {
  if (value in CN_DIGITS) return CN_DIGITS[value];

  const normalized = value.replace(/两/g, "二");
  const tens = normalized.match(/^十([一二三四五六七八九])?$/);
  if (tens) return 10 + (tens[1] ? CN_DIGITS[tens[1]] : 0);

  const twenties = normalized.match(/^二十([一二三四五六七八九])?$/);
  if (twenties) return 20 + (twenties[1] ? CN_DIGITS[twenties[1]] : 0);

  const thirties = normalized.match(/^三十([一二三四五六七八九])?$/);
  if (thirties) return 30 + (thirties[1] ? CN_DIGITS[thirties[1]] : 0);

  return null;
}

function parseNumber(value: string): number | null {
  if (/^\d{1,2}$/.test(value)) return parseInt(value, 10);
  return parseChineseNumber(value);
}

function normalizeHour(hour: number, text: string): number {
  if (/凌晨/.test(text)) return hour === 12 ? 0 : hour;
  if (/中午/.test(text)) return hour < 11 ? hour + 12 : hour;
  if (/下午|晚上|傍晚|今晚|明晚/.test(text) && hour < 12) {
    return hour + 12;
  }
  return hour;
}

function parseTimeOfDay(text: string): { hour: number; minute: number } | null {
  const numericTime = text.match(
    /(?:凌晨|下午|晚上|傍晚|上午|早上|中午)?\s*(\d{1,2})\s*[：:](\d{1,2})/,
  );
  if (numericTime) {
    return {
      hour: normalizeHour(parseInt(numericTime[1], 10), text),
      minute: Math.max(0, Math.min(59, parseInt(numericTime[2], 10))),
    };
  }

  const hourTime = text.match(
    new RegExp(
      `(?:凌晨|下午|晚上|傍晚|上午|早上|中午|今晚|明早|明晚)?\\s*(\\d{1,2}|${CN_NUMBER_PATTERN})\\s*点\\s*(半|一刻|三刻|\\d{1,2}|${CN_NUMBER_PATTERN})?`,
    ),
  );
  if (!hourTime) return null;

  const parsedHour = parseNumber(hourTime[1]);
  if (parsedHour === null || parsedHour > 24) return null;

  const minuteText = hourTime[2];
  let minute = 0;
  if (minuteText === "半") minute = 30;
  else if (minuteText === "一刻") minute = 15;
  else if (minuteText === "三刻") minute = 45;
  else if (minuteText) {
    const parsedMinute = parseNumber(minuteText);
    minute = parsedMinute === null ? 0 : Math.max(0, Math.min(59, parsedMinute));
  }

  return { hour: normalizeHour(parsedHour, text), minute };
}

function applyDate(date: Date, label: string, text: string): ClientDateInfo {
  const time = parseTimeOfDay(text);
  if (time) {
    date.setHours(time.hour, time.minute, 0, 0);
    return {
      dueText: `${label} ${String(time.hour).padStart(2, "0")}:${String(
        time.minute,
      ).padStart(2, "0")}`,
      dueAt: date.toISOString(),
    };
  }

  date.setHours(23, 59, 0, 0);
  return { dueText: label, dueAt: date.toISOString() };
}

export function parseClientDateInfo(
  text: string,
  reference: Date = new Date(),
): ClientDateInfo | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const now = reference;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const relativeDuration = trimmed.match(
    new RegExp(`(半|\\d{1,3}|${CN_NUMBER_PATTERN})\\s*(分钟|小时|天)\\s*后`),
  );
  if (relativeDuration) {
    const amountText = relativeDuration[1];
    const unit = relativeDuration[2];
    const amount = amountText === "半" ? 0.5 : parseNumber(amountText);

    if (amount && amount > 0) {
      const dueDate = new Date(now);
      if (unit === "分钟") {
        dueDate.setMinutes(dueDate.getMinutes() + amount);
      } else if (unit === "小时") {
        dueDate.setMinutes(dueDate.getMinutes() + amount * 60);
      } else {
        dueDate.setDate(dueDate.getDate() + amount);
      }

      return {
        dueText: relativeDuration[0].replace(/\s/g, ""),
        dueAt: dueDate.toISOString(),
      };
    }
  }

  const endOfMonth = trimmed.match(/月底|月末/);
  if (endOfMonth) {
    const date = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    date.setHours(23, 59, 0, 0);
    return {
      dueText: `${today.getMonth() + 1}月底`,
      dueAt: date.toISOString(),
    };
  }

  const nextMonthDay = trimmed.match(
    new RegExp(`下(?:个)?月\\s*(\\d{1,2}|${CN_NUMBER_PATTERN})\\s*(?:日|号)?`),
  );
  if (nextMonthDay) {
    const day = parseNumber(nextMonthDay[1]);
    if (day && day >= 1 && day <= 31) {
      const date = new Date(today.getFullYear(), today.getMonth() + 1, day);
      date.setHours(23, 59, 0, 0);
      return {
        dueText: `${date.getMonth() + 1}月${day}日`,
        dueAt: date.toISOString(),
      };
    }
  }

  const fullDate = trimmed.match(
    /(\d{4})\s*[-/年]\s*(\d{1,2})\s*[-/月]\s*(\d{1,2})\s*(?:日|号)?/,
  );
  if (fullDate) {
    const year = parseInt(fullDate[1], 10);
    const month = parseInt(fullDate[2], 10);
    const day = parseInt(fullDate[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      return applyDate(date, `${year}年${month}月${day}日`, trimmed);
    }
  }

  const monthDay = trimmed.match(
    new RegExp(`^(\\d{1,2}|${CN_NUMBER_PATTERN})\\s*月\\s*(\\d{1,2}|${CN_NUMBER_PATTERN})\\s*(?:日|号)?`),
  );
  if (monthDay) {
    const month = parseNumber(monthDay[1]);
    const day = parseNumber(monthDay[2]);
    if (month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(today.getFullYear(), month - 1, day);
      if (date.getTime() < today.getTime()) {
        date.setFullYear(date.getFullYear() + 1);
      }
      return applyDate(date, `${month}月${day}日`, trimmed);
    }
  }

  const relativeDays = [
    { pattern: /大后天/, offset: 3, label: "大后天" },
    { pattern: /后天|后日/, offset: 2, label: "后天" },
    { pattern: /明天|明日|明早|明晚/, offset: 1, label: "明天" },
    { pattern: /今天|今日|今晚|今早/, offset: 0, label: "今天" },
  ];

  const matchedRelative = relativeDays.find((entry) =>
    entry.pattern.test(trimmed),
  );
  if (matchedRelative) {
    const date = new Date(today);
    date.setDate(date.getDate() + matchedRelative.offset);
    return applyDate(date, matchedRelative.label, trimmed);
  }

  const weekday = trimmed.match(
    /(?:(上|下|本|这)(?:个)?(?:周|星期|礼拜)|(?:周|星期|礼拜))([一二三四五六日天末])/,
  );
  if (weekday) {
    const prefix = weekday[1] ?? "";
    const dayText = weekday[2];
    const targetDay =
      dayText === "天" || dayText === "日" || dayText === "末"
        ? 0
        : WEEKDAY_NAMES.indexOf(dayText);

    if (targetDay !== -1) {
      const date = new Date(today);
      const currentDay = date.getDay();
      let daysFromNow = targetDay - currentDay;
      if (prefix === "上") daysFromNow -= 7;
      else if (prefix === "下") daysFromNow += 7;
      else if (!prefix && daysFromNow <= 0) daysFromNow += 7;

      date.setDate(date.getDate() + daysFromNow);
      const label =
        prefix === "下"
          ? `下周${dayText === "末" ? "末" : WEEKDAY_NAMES[targetDay]}`
          : `周${dayText === "末" ? "末" : WEEKDAY_NAMES[targetDay]}`;
      return applyDate(date, label, trimmed);
    }
  }

  const time = parseTimeOfDay(trimmed);
  if (time) {
    const date = new Date(today);
    return applyDate(date, "今天", trimmed);
  }

  return null;
}
