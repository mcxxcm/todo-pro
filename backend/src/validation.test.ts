import assert from "node:assert/strict";
import { validateExtractionText, validateOcrImage } from "./validation";

assert.deepEqual(validateExtractionText("  明天交报告  "), {
  ok: true,
  value: "明天交报告",
});
assert.deepEqual(validateExtractionText(" "), {
  ok: false,
  message: "text must be a non-empty string",
});
assert.equal(validateExtractionText("x".repeat(20_001)).ok, false);

assert.deepEqual(validateOcrImage(" data:image/png;base64,QUJDRA== "), {
  ok: true,
  value: "QUJDRA==",
});
assert.deepEqual(validateOcrImage("not base64!?"), {
  ok: false,
  message: "image must contain valid base64 characters",
});

console.log("Backend validation checks passed: 5");

