export type SourceItemType =
  | "manual"
  | "text"
  | "share"
  | "link"
  | "image"
  | "pdf"
  | "email";

export interface SourceItem {
  id: string;
  type: SourceItemType;
  title?: string;
  rawContent?: string;
  origin?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
}
