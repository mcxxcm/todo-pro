import { TaskPriority, TimeConfidence, TimeStatus } from "./task";

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
  timeStatus?: TimeStatus;
  /** 0 (least confident) to 1 (most confident) */
  confidence?: number;
}

export interface ExtractionResult {
  tasks: ExtractedTask[];
  rawText: string;
}
