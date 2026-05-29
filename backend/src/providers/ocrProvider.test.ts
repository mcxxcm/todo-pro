import assert from "node:assert/strict";
import { createOcrProvider, normalizeOcrText } from "./ocrProvider";

assert.equal(
  normalizeOcrText("  第一行\r\n\r\n\r\n第二行  "),
  "第一行\n\n第二行",
);
assert.equal(normalizeOcrText(null), "");
assert.equal(normalizeOcrText("x".repeat(20_010)).length, 20_000);

const previousProvider = process.env.OCR_PROVIDER;

process.env.OCR_PROVIDER = "apple_vision";
assert.equal(createOcrProvider().name, "apple_vision");

process.env.OCR_PROVIDER = "deepseek";
assert.equal(createOcrProvider().name, "mock");

if (previousProvider === undefined) {
  delete process.env.OCR_PROVIDER;
} else {
  process.env.OCR_PROVIDER = previousProvider;
}

console.log("OCR normalization checks passed: 5");
