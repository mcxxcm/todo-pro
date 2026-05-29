import { normalizeOcrText } from "./ocrProvider";

export async function extractTextWithOcrSpace(imageBase64: string): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
  // OCR Space expects the 'data:image/[type];base64,' prefix
  const base64Data = imageBase64.startsWith("data:") 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`;

  const body = new URLSearchParams();
  body.append("apikey", apiKey);
  body.append("language", "chs"); // Chinese Simplified (includes English)
  body.append("base64Image", base64Data);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body,
      signal: controller.signal as any,
    });

    if (!response.ok) {
      throw new Error(`OCR Space API error: ${response.status}`);
    }

    const json = await response.json();
    if (json.IsErroredOnProcessing) {
      throw new Error(`OCR Space Processing Error: ${json.ErrorMessage?.join(", ") || "Unknown"}`);
    }

    if (!json.ParsedResults || json.ParsedResults.length === 0) {
      return "";
    }

    const text = json.ParsedResults.map((r: any) => r.ParsedText).join("\n");
    return normalizeOcrText(text);
  } finally {
    clearTimeout(timeoutId);
  }
}
