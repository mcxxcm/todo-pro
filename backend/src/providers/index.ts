import { mockExtract } from "../mock";
import { extractTasksWithDeepSeek } from "./deepseekProvider";

type ProviderName = "mock" | "deepseek";

export interface ExtractedTaskResult {
  title: string;
  sourceText: string | null;
  dueText?: string | null;
  dueAt?: string | null;
  notes?: string | null;
  confidence?: number;
}

export interface ExtractionResult {
  tasks: ExtractedTaskResult[];
}

export interface TaskExtractionProvider {
  name: ProviderName;
  extractTasks(text: string): Promise<ExtractionResult>;
}

function resolveProviderName(): ProviderName {
  return process.env.TASK_EXTRACTOR === "deepseek" ? "deepseek" : "mock";
}

export function createTaskExtractionProvider(): TaskExtractionProvider {
  const providerName = resolveProviderName();

  if (providerName === "deepseek") {
    return {
      name: "deepseek",
      extractTasks: extractTasksWithDeepSeek,
    };
  }

  return {
    name: "mock",
    extractTasks: async (text: string) => mockExtract(text),
  };
}
