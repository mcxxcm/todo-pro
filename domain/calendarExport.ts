import type { TaskExportPayload } from "@/types/export";

export interface CalendarExportResult {
  ics: string;
  uid: string;
}

export function buildCalendarIcs(
  payload: TaskExportPayload,
  options: { uid: string; now: Date | string },
): CalendarExportResult {
  if (!payload.dueAt) {
    throw new Error("Calendar export requires dueAt");
  }

  const start = new Date(payload.dueAt);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Calendar export requires a valid dueAt");
  }

  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const now = options.now instanceof Date
    ? options.now
    : new Date(options.now);
  const description = buildDescription(payload);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Todo Pro//Task Export//EN",
    "BEGIN:VEVENT",
    `UID:${escapeIcsValue(options.uid)}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsValue(payload.title)}`,
    ...(description ? [`DESCRIPTION:${escapeIcsValue(description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return {
    ics: lines.join("\r\n"),
    uid: options.uid,
  };
}

function buildDescription(payload: TaskExportPayload): string {
  return [
    payload.notes,
    payload.dueText ? `Due: ${payload.dueText}` : undefined,
    payload.source?.text ? `Source: ${payload.source.text}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

