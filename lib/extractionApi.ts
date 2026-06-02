import { BACKEND_URL } from "@/lib/backendConfig";

const EXTRACT_ENDPOINT = "/api/v1/extract-tasks";

export interface BackendExtractedTask {
  title: string;
  sourceText?: string | null;
  dueText: string | null;
  dueAt?: string | null;
  notes: string | null;
  confidence: number;
}

export interface BackendExtractionResponse {
  tasks: BackendExtractedTask[];
}

export function normalizeBackendExtractionResponse(
  raw: unknown,
): BackendExtractionResponse {
  if (!raw || typeof raw !== "object") return { tasks: [] };

  const input = raw as Record<string, unknown>;
  if (!Array.isArray(input.tasks)) return { tasks: [] };

  return {
    tasks: input.tasks
      .map((item) => normalizeBackendTask(item))
      .filter((task): task is BackendExtractedTask => task !== null),
  };
}

export async function extractTasksFromText(
  text: string,
): Promise<BackendExtractionResponse> {
  const response = await fetch(`${BACKEND_URL}${EXTRACT_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Server error (${response.status})`);
  }

  return normalizeBackendExtractionResponse(await response.json());
}

export async function extractTasksFromImage(
  imageBase64: string,
): Promise<BackendExtractionResponse & { ocrText: string }> {
  const EXTRACT_IMAGE_ENDPOINT = "/api/v1/extract-tasks-from-image";
  const response = await fetch(`${BACKEND_URL}${EXTRACT_IMAGE_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Server error (${response.status})`);
  }

  const data = await response.json();
  const normalized = normalizeBackendExtractionResponse(data);
  return {
    ...normalized,
    ocrText: typeof data.ocrText === "string" ? data.ocrText : "",
  };
}

function normalizeBackendTask(raw: unknown): BackendExtractedTask | null {
  if (!raw || typeof raw !== "object") return null;

  const item = raw as Record<string, unknown>;
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!title) return null;

  return {
    title,
    confidence: normalizeConfidence(item.confidence),
    dueAt: typeof item.dueAt === "string" && item.dueAt.trim()
      ? item.dueAt.trim()
      : null,
    dueText: typeof item.dueText === "string" && item.dueText.trim()
      ? item.dueText.trim()
      : null,
    notes: typeof item.notes === "string" && item.notes.trim()
      ? item.notes.trim()
      : null,
    sourceText: typeof item.sourceText === "string" && item.sourceText.trim()
      ? item.sourceText.trim()
      : null,
  };
}

const DECOMPOSE_ENDPOINT = "/api/v1/decompose-task";

export interface DecomposeTaskRequest {
  title: string;
  notes?: string;
  dueAt?: string;
}

export interface DecomposeTaskResult {
  subtasks: { title: string; estimatedMinutes: number }[];
}

export async function decomposeTask(
  input: DecomposeTaskRequest,
): Promise<DecomposeTaskResult> {
  const response = await fetch(`${BACKEND_URL}${DECOMPOSE_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `Server error (${response.status})`);
  }

  const data = await response.json();
  return {
    subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
  };
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}
