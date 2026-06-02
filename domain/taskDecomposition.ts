import type { SubTask } from "@/types/task";

export interface DecompositionInput {
  title: string;
  notes?: string;
  dueAt?: string;
}

export interface DecompositionResult {
  subtasks: SubTask[];
  totalEstimatedMinutes: number;
}

let idCounter = 0;

function nextSubTaskId(): string {
  idCounter += 1;
  return `sub-${Date.now()}-${idCounter}`;
}

/**
 * Build a prompt for an LLM to decompose a complex task into subtasks.
 * Returns a structured prompt string ready to send to the AI backend.
 */
export function buildDecompositionPrompt(task: DecompositionInput): string {
  const contextLines = [
    `请将以下任务拆解成 3-7 个可执行的子任务：`,
    `主任务：${task.title}`,
  ];

  if (task.notes) {
    contextLines.push(`备注：${task.notes}`);
  }
  if (task.dueAt) {
    contextLines.push(`截止日期：${new Date(task.dueAt).toLocaleDateString("zh-CN")}`);
  }

  contextLines.push(
    ``,
    `要求：`,
    `1. 每个子任务应该是一个具体的、可单独完成的操作`,
    `2. 为每个子任务估算预计耗时（分钟）`,
    `3. 按执行顺序排列`,
    `4. 用 JSON 数组格式回复，每个元素包含 title 和 estimatedMinutes 字段`,
    ``,
    `示例回复格式：`,
    `[
  {"title": "整理数学笔记第1-3章", "estimatedMinutes": 60},
  {"title": "做往年真题卷一", "estimatedMinutes": 90},
  {"title": "复习错题集", "estimatedMinutes": 45}
]`,
  );

  return contextLines.join("\n");
}

/**
 * Parse the LLM response into SubTask objects.
 * Handles both ideal JSON output and common malformed responses.
 */
export function parseDecompositionResult(
  rawResponse: string,
): DecompositionResult {
  let subtasks: SubTask[] = [];
  const now = new Date().toISOString();

  // Try to extract JSON array from response
  const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        subtasks = parsed.map((item: any) => ({
          id: nextSubTaskId(),
          title: String(item.title ?? item.task ?? "").trim(),
          status: "todo" as const,
          estimatedMinutes: Math.max(1, Math.min(480, Number(item.estimatedMinutes ?? item.minutes ?? 30))),
          createdAt: now,
          updatedAt: now,
        })).filter((s) => s.title.length > 0);
      }
    } catch {
      // JSON parse failed — fall through to line-by-line parsing
    }
  }

  // Fallback: parse numbered/bullet lines
  if (subtasks.length === 0) {
    const lines = rawResponse.split("\n").filter((l) => l.trim().length > 0);
    for (const line of lines) {
      const cleaned = line
        .replace(/^\d+[.、）)]\s*/, "")
        .replace(/^[-*]\s*/, "")
        .replace(/^[•·]\s*/, "")
        .trim();

      if (cleaned.length >= 2) {
        const timeMatch = cleaned.match(/[（(]?预计\s*(\d+)\s*(分钟|小时|h|min)[）)]?/i);
        let estimatedMinutes: number | undefined;
        if (timeMatch) {
          estimatedMinutes = parseInt(timeMatch[1], 10);
          if (/小时|h/i.test(timeMatch[2])) {
            estimatedMinutes *= 60;
          }
        }

        subtasks.push({
          id: nextSubTaskId(),
          title: cleaned,
          status: "todo",
          estimatedMinutes,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  const totalEstimatedMinutes = subtasks.reduce(
    (sum, s) => sum + (s.estimatedMinutes ?? 30),
    0,
  );

  return { subtasks, totalEstimatedMinutes };
}

/** Reset the internal ID counter (useful in tests). */
export function resetDecompositionIdCounter(): void {
  idCounter = 0;
}
