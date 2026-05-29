import { BACKEND_URL } from "@/lib/backendConfig";

const OCR_ENDPOINT = "/api/v1/ocr";

export interface OcrResponse {
  text: string;
}

export async function extractTextFromImage(
  imageBase64: string,
): Promise<OcrResponse> {
  const response = await fetch(`${BACKEND_URL}${OCR_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `OCR server error (${response.status})`);
  }

  return response.json();
}
