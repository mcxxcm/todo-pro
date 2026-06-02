import type { RecurrenceRule, RecurrenceFrequency } from "@/types/task";

export interface NextOccurrence {
  dueAt: string;
  dueText: string;
}

/** Compute the next occurrence date from a recurrence rule, given the last due date. */
export function computeNextOccurrence(
  rule: RecurrenceRule,
  lastDueAt: string,
  reference: Date = new Date(),
): NextOccurrence | null {
  const lastDue = new Date(lastDueAt);
  if (isNaN(lastDue.getTime())) return null;

  if (rule.count !== undefined && rule.count <= 0) return null;

  const next = new Date(lastDue);

  switch (rule.frequency) {
    case "daily":
      next.setDate(next.getDate() + rule.interval);
      break;
    case "weekly": {
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        // Specific days of week: find the next matching day
        const sorted = [...rule.daysOfWeek].sort((a, b) => a - b);
        const currentDay = next.getDay();
        let found = false;
        for (const d of sorted) {
          if (d > currentDay) {
            next.setDate(next.getDate() + (d - currentDay));
            found = true;
            break;
          }
        }
        if (!found) {
          // Wrap to next week
          const firstDay = sorted[0];
          next.setDate(next.getDate() + (7 - currentDay + firstDay));
        }
      } else {
        next.setDate(next.getDate() + 7 * rule.interval);
      }
      break;
    }
    case "monthly":
      next.setMonth(next.getMonth() + rule.interval);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + rule.interval);
      break;
  }

  // If we fell behind reference, advance until caught up
  while (next.getTime() <= reference.getTime()) {
    switch (rule.frequency) {
      case "daily":
        next.setDate(next.getDate() + rule.interval);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7 * rule.interval);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + rule.interval);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + rule.interval);
        break;
    }
  }

  // Check end conditions
  if (rule.endDate && next.getTime() > new Date(rule.endDate).getTime()) {
    return null;
  }

  const freqLabel: Record<RecurrenceFrequency, string> = {
    daily: "天",
    weekly: "周",
    monthly: "月",
    yearly: "年",
  };
  const dueText = `每${rule.interval > 1 ? rule.interval : ""}${freqLabel[rule.frequency]}重复`;
  const dueAt = next.toISOString();

  return { dueAt, dueText };
}

/** Generate the next N occurrences from a rule. */
export function generateOccurrences(
  rule: RecurrenceRule,
  lastDueAt: string,
  count: number,
): NextOccurrence[] {
  const results: NextOccurrence[] = [];
  let current = lastDueAt;
  // Use the last due date as reference so the sequence starts from there,
  // not from "now" (which would skip past occurrences).
  const baseReference = new Date(lastDueAt);

  for (let i = 0; i < count; i++) {
    const next = computeNextOccurrence(rule, current, baseReference);
    if (!next) break;
    results.push(next);
    current = next.dueAt;
  }

  return results;
}
