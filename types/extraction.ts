import { TaskPriority, TimeConfidence } from "./task";

export interface ExtractedTask {
  id: string;
  title: string;
  sourceText: string;
  dueText?: string;
  dueAt?: string;
  priority: TaskPriority;
  tags: string[];
  notes?: string;
  timeConfidence: TimeConfidence;
}

export interface ExtractionResult {
  tasks: ExtractedTask[];
  rawText: string;
}
