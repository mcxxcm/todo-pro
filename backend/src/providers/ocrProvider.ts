import { extractTextWithAppleVision } from "./appleVisionOcr";
import { extractTextWithOcrSpace } from "./ocrSpaceProvider";

type OcrProviderName = "mock" | "apple_vision" | "ocr_space";
const MAX_OCR_TEXT_LENGTH = 20_000;

export interface OcrProvider {
  name: OcrProviderName;
  extractText(imageBase64: string): Promise<{ text: string }>;
}

function resolveOcrProviderName(): OcrProviderName {
  const envProvider = process.env.OCR_PROVIDER;
  if (envProvider === "apple_vision") return "apple_vision";
  if (envProvider === "ocr_space") return "ocr_space";
  return "mock";
}

export function normalizeOcrText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_OCR_TEXT_LENGTH);
}

async function ocrWithAppleVision(imageBase64: string): Promise<{ text: string }> {
  return { text: normalizeOcrText(await extractTextWithAppleVision(imageBase64)) };
}

async function ocrWithOcrSpace(imageBase64: string): Promise<{ text: string }> {
  return { text: await extractTextWithOcrSpace(imageBase64) };
}

async function mockOcr(_imageBase64: string): Promise<{ text: string }> {
  return {
    text: normalizeOcrText(
      "明天下午3点前联系老师确认论文题目\n下周五提交报告",
    ),
  };
}

export function createOcrProvider(): OcrProvider {
  const name = resolveOcrProviderName();

  if (name === "apple_vision") {
    return { name: "apple_vision", extractText: ocrWithAppleVision };
  }
  if (name === "ocr_space") {
    return { name: "ocr_space", extractText: ocrWithOcrSpace };
  }

  return { name: "mock", extractText: mockOcr };
}
