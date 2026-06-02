import assert from "node:assert/strict";
import { computeNextOccurrence, generateOccurrences } from "./recurrence";
import type { RecurrenceRule } from "../types/task";

const ref = new Date("2025-07-15T12:00:00Z");

// daily
{
  const rule: RecurrenceRule = { frequency: "daily", interval: 1 };
  const next = computeNextOccurrence(rule, "2025-07-15T10:00:00Z", ref);
  assert.ok(next);
  assert.equal(next!.dueAt, new Date("2025-07-16T10:00:00Z").toISOString());
}

// daily interval 3
{
  const rule: RecurrenceRule = { frequency: "daily", interval: 3 };
  const next = computeNextOccurrence(rule, "2025-07-15T10:00:00Z", ref);
  assert.equal(new Date(next!.dueAt).getDate(), 18);
}

// weekly
{
  const rule: RecurrenceRule = { frequency: "weekly", interval: 1 };
  const next = computeNextOccurrence(rule, "2025-07-15T10:00:00Z", ref);
  assert.equal(new Date(next!.dueAt).getDate(), 22); // 7 days later
}

// weekly with specific days
{
  // July 15 2025 is a Tuesday (day 2). daysOfWeek [1, 3] = Monday, Wednesday.
  // Next after Tuesday is Wednesday (day 3)
  const rule: RecurrenceRule = { frequency: "weekly", interval: 1, daysOfWeek: [1, 3] };
  const next = computeNextOccurrence(rule, "2025-07-15T10:00:00Z", ref);
  const d = new Date(next!.dueAt);
  assert.equal(d.getDay(), 3); // Wednesday
}

// monthly
{
  const rule: RecurrenceRule = { frequency: "monthly", interval: 1 };
  const next = computeNextOccurrence(rule, "2025-07-15T10:00:00Z", ref);
  assert.equal(new Date(next!.dueAt).getMonth(), 7); // August
}

// endDate reached
{
  const rule: RecurrenceRule = { frequency: "daily", interval: 1, endDate: "2025-07-16T00:00:00Z" };
  const next = computeNextOccurrence(rule, "2025-07-15T10:00:00Z", ref);
  assert.equal(next, null);
}

// count = 0 means no more
{
  const rule: RecurrenceRule = { frequency: "daily", interval: 1, count: 0 };
  const next = computeNextOccurrence(rule, "2025-07-15T10:00:00Z", ref);
  assert.equal(next, null);
}

// generateOccurrences
{
  const rule: RecurrenceRule = { frequency: "daily", interval: 1 };
  const occurrences = generateOccurrences(rule, "2025-07-15T10:00:00Z", 3);
  assert.equal(occurrences.length, 3);
  assert.equal(new Date(occurrences[0].dueAt).getDate(), 16);
  assert.equal(new Date(occurrences[2].dueAt).getDate(), 18);
}

console.log("recurrence tests passed: 8");
