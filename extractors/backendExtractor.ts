import { Extractor } from "./types";
import { ExtractedTask, ExtractionResult } from "@/types/extraction";
import { TaskPriority, TimeConfidence } from "@/types/task";
import { EXTRACTOR_CONFIG } from "@/constants/extractorConfig";

const FULL_URL = `${EXTRACTOR_CONFIG.BACKEND_URL}${EXTRACTOR_CONFIG.EXTRACT_ENDPOINT}`;

let idCounter = 0;

function nextId(): string {
  idCounter += 1;
  return `be-${Date.now()}-${idCounter}`;
}

const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high"];
const CONFIDENCES: TimeConfidence[] = ["high", "medium", "low", "none"];

function toPriority(v: unknown): TaskPriority {
  return PRIORITIES.includes(v as TaskPriority) ? (v as TaskPriority) : "none";
}

function toTimeConfidence(v: unknown): TimeConfidence {
  return CONFIDENCES.includes(v as TimeConfidence)
    ? (v as TimeConfidence)
    : "none";
}

export class BackendExtractor implements Extractor {
  readonly name = "backend";

  async extract(text: string): Promise<ExtractionResult> {
    const trimmed = text.trim();
    if (!trimmed) return { tasks: [], rawText: text };

    // 1. Network error
    let response: Response;
    try {
      response = await fetch(FULL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
    } catch (err) {
      console.warn("[BackendExtractor] network error:", err);
      return { tasks: [], rawText: text };
    }

    // 2. Non-200 response
    if (!response.ok) {
      console.warn(
        `[BackendExtractor] server error: ${response.status}`,
        await response.text().catch(() => ""),
      );
      return { tasks: [], rawText: text };
    }

    // 3. Invalid JSON
    let body: unknown;
    try {
      body = await response.json();
    } catch (err) {
      console.warn("[BackendExtractor] invalid JSON:", err);
      return { tasks: [], rawText: text };
    }

    // 4. tasks not an array
    if (
      !body ||
      typeof body !== "object" ||
      !Array.isArray((body as Record<string, unknown>).tasks)
    ) {
      console.warn("[BackendExtractor] response.tasks is not an array:", body);
      return { tasks: [], rawText: text };
    }

    const rawTasks = (body as { tasks: Record<string, unknown>[] }).tasks;

    const tasks: ExtractedTask[] = rawTasks.map((t) => ({
      id: nextId(),
      title: typeof t.title === "string" ? t.title : String(t.title ?? ""),
      sourceText:
        typeof t.sourceText === "string" ? t.sourceText : trimmed,
      dueText: typeof t.dueText === "string" ? t.dueText : undefined,
      dueAt: typeof t.dueAt === "string" ? t.dueAt : undefined,
      priority: toPriority(t.priority),
      tags: Array.isArray(t.tags) ? t.tags.map(String) : [],
      notes: typeof t.notes === "string" ? t.notes : undefined,
      timeConfidence: toTimeConfidence(t.timeConfidence),
      confidence:
        typeof t.confidence === "number" ? t.confidence : undefined,
    }));

    return { tasks, rawText: text };
  }
}
