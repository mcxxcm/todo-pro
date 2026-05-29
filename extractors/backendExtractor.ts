import { Extractor } from "./types";
import { ExtractedTask, ExtractionResult } from "@/types/extraction";
import {
  extractTasksFromText,
  extractTasksFromImage,
  type BackendExtractedTask,
} from "@/lib/extractionApi";

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `be-${Date.now()}-${idCounter}`;
}

export class BackendExtractor implements Extractor {
  readonly name = "backend";

  async extract(text: string): Promise<ExtractionResult> {
    const trimmed = text.trim();
    if (!trimmed) return { tasks: [], rawText: text };

    let result: { tasks: BackendExtractedTask[] };
    try {
      result = await extractTasksFromText(trimmed);
    } catch (err) {
      // ByteString errors indicate non-ASCII characters in HTTP headers
      // (e.g. Chinese text in Authorization header on the backend side).
      if (err instanceof Error && /ByteString/i.test(err.message)) {
        throw new Error(
          "请求头包含非法字符，请检查前端 API client 的 headers。",
        );
      }
      if (err instanceof TypeError) {
        throw new Error(
          "Cannot connect to backend. Make sure backend is running at http://localhost:8787",
        );
      }
      throw err;
    }

    const tasks: ExtractedTask[] = result.tasks.map(
      (t: BackendExtractedTask) => ({
        id: nextId(),
        title: t.title,
        sourceText: t.sourceText?.trim() || trimmed,
        dueText: t.dueText ?? undefined,
        dueAt: t.dueAt ?? undefined,
        timeStatus: t.dueText ? "needs_review" : "none",
        priority: "none" as const,
        tags: [],
        notes: t.notes ?? undefined,
        timeConfidence: t.dueAt ? "medium" : "none",
        confidence: t.confidence,
      }),
    );

    return { tasks, rawText: text };
  }

  async extractFromImage(imageBase64: string): Promise<ExtractionResult & { ocrText: string }> {
    let result: { tasks: BackendExtractedTask[], ocrText: string };
    try {
      result = await extractTasksFromImage(imageBase64);
    } catch (err) {
      if (err instanceof Error && /ByteString/i.test(err.message)) {
        throw new Error(
          "请求头包含非法字符，请检查前端 API client 的 headers。",
        );
      }
      if (err instanceof TypeError) {
        throw new Error(
          "Cannot connect to backend. Make sure backend is running at http://localhost:8787",
        );
      }
      throw err;
    }

    const tasks: ExtractedTask[] = result.tasks.map(
      (t: BackendExtractedTask) => ({
        id: nextId(),
        title: t.title,
        sourceText: t.sourceText?.trim() || result.ocrText,
        dueText: t.dueText ?? undefined,
        dueAt: t.dueAt ?? undefined,
        timeStatus: t.dueText ? "needs_review" : "none",
        priority: "none" as const,
        tags: [],
        notes: t.notes ?? undefined,
        timeConfidence: t.dueAt ? "medium" : "none",
        confidence: t.confidence,
      }),
    );

    return { tasks, rawText: result.ocrText, ocrText: result.ocrText };
  }
}
