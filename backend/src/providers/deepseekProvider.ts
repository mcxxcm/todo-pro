import { parseChineseDateInfo } from "../time/parseChineseTime";

interface DeepSeekTask {
  title: string;
  sourceText: string | null;
  dueText: string | null;
  dueAt: string | null;
  notes: string | null;
  confidence: number;
}

interface DeepSeekResult {
  tasks: DeepSeekTask[];
}

const MAX_DEEPSEEK_TASKS = 20;
const MAX_TITLE_LENGTH = 160;
const MAX_SOURCE_TEXT_LENGTH = 2_000;
const MAX_NOTES_LENGTH = 1_000;

function requireDeepSeekApiKey(): string {
  const value = process.env.DEEPSEEK_API_KEY;
  if (!value) {
    throw new Error("Missing required environment variable: DEEPSEEK_API_KEY");
  }
  return value;
}

function buildExtractionPrompt(
  input: string,
): { role: string; content: string }[] {
  const systemPrompt = `You are a task extraction assistant. Extract only actionable tasks from the user's input.

Return a JSON object with this exact schema:
{
  "tasks": [
    {
      "title": "clear concise task description",
      "sourceText": "the exact source sentence or fragment that produced this task, or null if unavailable",
      "dueText": "preserve the original Chinese time expression exactly as written (e.g. 明天, 周五, 下周一, 下午三点, 今天晚上八点之前), or null if not mentioned",
      "notes": "additional context or null",
      "confidence": 0.0 to 1.0
    }
  ]
}

Rules:
- Extract only actionable tasks with a clear action. Ignore casual text, greetings, or general chat with no task.
- title must be concise and actionable (e.g. "交数学作业" not "明天下午三点前交数学作业")
- sourceText must quote the smallest exact input fragment that supports the task.
- dueText must preserve the original fuzzy Chinese time expression exactly as written. Do NOT interpret, normalize, translate, or invent dates.
- notes can include additional context like who, where, how.
- If no actionable tasks are found, return { "tasks": [] }.
- Return ONLY this JSON object, no other text.`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: input },
  ];
}

function stripCodeFence(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

export function normalizeDeepSeekExtractionResult(raw: unknown): DeepSeekResult {
  if (!raw || typeof raw !== "object") return { tasks: [] };

  const input = raw as Record<string, unknown>;
  if (!Array.isArray(input.tasks)) return { tasks: [] };

  const tasks: DeepSeekTask[] = [];

  for (const item of input.tasks.slice(0, MAX_DEEPSEEK_TASKS)) {
    if (!item || typeof item !== "object") continue;

    const task = item as Record<string, unknown>;

    // title must be a non-empty string
    const title = typeof task.title === "string"
      ? task.title.trim().slice(0, MAX_TITLE_LENGTH)
      : "";
    if (!title) continue;

    // dueText: string or null, trim, convert empty to null
    let dueText: string | null =
      typeof task.dueText === "string" ? task.dueText.trim() : null;
    if (dueText === "") dueText = null;

    // sourceText: exact source fragment when the provider can identify one
    let sourceText: string | null =
      typeof task.sourceText === "string" ? task.sourceText.trim() : null;
    if (sourceText === "") sourceText = null;
    if (sourceText && sourceText.length > MAX_SOURCE_TEXT_LENGTH) {
      sourceText = sourceText.slice(0, MAX_SOURCE_TEXT_LENGTH);
    }

    // notes: string or null, trim, convert empty to null
    let notes: string | null =
      typeof task.notes === "string" ? task.notes.trim() : null;
    if (notes === "") notes = null;
    if (notes && notes.length > MAX_NOTES_LENGTH) {
      notes = notes.slice(0, MAX_NOTES_LENGTH);
    }

    const parsedTime = dueText ? parseChineseDateInfo(dueText) : null;
    const dueAt = parsedTime?.dueAt ?? null;

    // confidence: finite number clamped to [0, 1]
    let confidence = 0.5;
    if (typeof task.confidence === "number" && isFinite(task.confidence)) {
      confidence = Math.max(0, Math.min(1, task.confidence));
    }

    tasks.push({ title, sourceText, dueText, dueAt, notes, confidence });
  }

  return { tasks };
}

function validateApiKey(key: string): void {
  // Non-ASCII characters trigger ByteString errors in the Authorization header.
  if (/[^\x00-\x7F]/.test(key)) {
    throw new Error(
      "Invalid DEEPSEEK_API_KEY: must contain only ASCII characters. Check backend/.env and replace placeholder text with a real API key.",
    );
  }
  // Catch common ASCII placeholders before they reach the API.
  const lower = key.toLowerCase();
  if (
    lower.includes("your") ||
    lower.includes("placeholder") ||
    lower.includes("api key")
  ) {
    throw new Error(
      "Invalid DEEPSEEK_API_KEY: value appears to be a placeholder. Check backend/.env and replace it with a real API key.",
    );
  }
}

export async function extractTasksWithDeepSeek(
  input: string,
): Promise<DeepSeekResult> {
  const apiKey = requireDeepSeekApiKey();
  validateApiKey(apiKey);
  const baseUrl = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/+$/, "");
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const messages = buildExtractionPrompt(input);

  const TIMEOUT_MS = 30_000;
  const MAX_RETRIES = 2;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        const isRetryable = response.status === 429 || response.status >= 500;
        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = Math.min(1000 * 2 ** attempt, 4000);
          await new Promise((r) => setTimeout(r, delay));
          lastError = new Error(`DeepSeek API error ${response.status}: ${body}`);
          continue;
        }
        throw new Error(`DeepSeek API error ${response.status}: ${body}`);
      }

      const data = await response.json();
      const content: string | undefined = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("DeepSeek returned empty response");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(stripCodeFence(content));
      } catch {
        throw new Error("Failed to parse DeepSeek response as JSON");
      }

      return normalizeDeepSeekExtractionResult(parsed);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        lastError = new Error("DeepSeek API request timed out after 30s");
        if (attempt < MAX_RETRIES) {
          continue;
        }
      }
      if (lastError && attempt >= MAX_RETRIES) {
        throw lastError;
      }
      throw err;
    }
  }

  throw lastError ?? new Error("DeepSeek extraction failed");
}
