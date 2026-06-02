import assert from "node:assert/strict";
import { parseClientDateInfo } from "../lib/clientTimeParser";
import {
  parseChineseDateInfo,
} from "../backend/src/time/parseChineseTime";

/**
 * Time parser consistency test.
 *
 * Two parsers exist:
 *   1. Frontend: lib/clientTimeParser.ts — parseClientDateInfo(text)
 *   2. Backend:  backend/src/time/parseChineseTime.ts — parseChineseDateInfo(text)
 *
 * Both target Chinese natural-language time expressions.
 * This test calls BOTH parsers with identical input and verifies:
 *   a) Both either parse or both return null (no silent divergence)
 *   b) The date granularity is compatible (same day, same month pattern)
 */

const refDate = new Date("2026-06-02T12:00:00.000Z");

const TEST_CASES: { text: string; expectParse: boolean }[] = [
  { text: "明天下午3点", expectParse: true },
  { text: "今晚八点前", expectParse: true },
  { text: "下周五", expectParse: true },
  { text: "下个月3号", expectParse: true },
  { text: "月底前", expectParse: true },
  { text: "半小时后", expectParse: true },
  { text: "", expectParse: false },
  { text: "去买菜", expectParse: false },
];

for (const { text, expectParse } of TEST_CASES) {
  const clientResult = parseClientDateInfo(text, refDate);
  const backendResult = parseChineseDateInfo(text, refDate);

  if (expectParse) {
    assert.ok(clientResult, `Client parser should parse: "${text}"`);
    assert.ok(backendResult, `Backend parser should parse: "${text}"`);
  } else {
    assert.equal(clientResult, null, `Client parser should return null for: "${text}"`);
    assert.equal(backendResult, null, `Backend parser should return null for: "${text}"`);
  }

  // If both parsed, compare exact date and time output
  if (clientResult && backendResult) {
    assert.equal(
      clientResult.dueAt,
      backendResult.dueAt,
      `dueAt mismatch for "${text}": client=${clientResult.dueAt}, backend=${backendResult.dueAt}`
    );

    // Both should produce non-empty dueText or dueAt
    assert.ok(clientResult.dueAt || clientResult.dueText,
      `Client result should have dueAt or dueText for: "${text}"`);
    assert.ok(backendResult.dueAt || backendResult.dueText,
      `Backend result should have dueAt or dueText for: "${text}"`);
  }
}

// --- Specific known pattern tests ---

// "明天下午3点" → should produce afternoon time
{
  const r = parseClientDateInfo("明天下午3点", refDate);
  if (r) {
    const h = new Date(r.dueAt).getHours();
    assert.ok(h >= 12 && h <= 17, `Expected afternoon hours, got ${h}: ${r.dueAt}`);
  }
}

// "下周五" → should be a Friday
{
  const r1 = parseClientDateInfo("下周五", refDate);
  const r2 = parseChineseDateInfo("下周五", refDate);
  if (r1) assert.equal(new Date(r1.dueAt).getDay(), 5, "Client: should be Friday");
  if (r2) assert.equal(new Date(r2.dueAt).getDay(), 5, "Backend: should be Friday");
}

console.log("Time consistency checks passed: 10");

