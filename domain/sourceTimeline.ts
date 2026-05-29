import type { TaskDraft } from "@/types/draft";
import type { SourceItem, SourceItemType } from "@/types/source";
import type { NormalizedTask } from "@/types/task";

export interface SourceTimelineItem {
  id: string;
  type: SourceItemType;
  title: string;
  preview: string;
  createdAt: string;
  origin?: string;
  taskCount: number;
  draftCount: number;
  url?: string;
  isOrphan: boolean;
}

export function buildSourceTimeline(input: {
  drafts: TaskDraft[];
  sources: SourceItem[];
  tasks: NormalizedTask[];
}): SourceTimelineItem[] {
  return input.sources
    .map((source) => {
      const taskCount = input.tasks.filter(
        (task) => task.sourceId === source.id,
      ).length;
      const draftCount = input.drafts.filter(
        (draft) => draft.sourceId === source.id,
      ).length;

      return {
        id: source.id,
        type: source.type,
        title: source.title?.trim() || getSourceTypeLabel(source.type),
        preview: getPreview(source),
        createdAt: source.createdAt,
        origin: source.origin,
        taskCount,
        draftCount,
        url: typeof source.metadata?.url === "string" ? source.metadata.url : undefined,
        isOrphan: taskCount === 0 && draftCount === 0,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function getOrphanSourceIds(input: {
  drafts: TaskDraft[];
  sources: SourceItem[];
  tasks: NormalizedTask[];
}): string[] {
  return buildSourceTimeline(input)
    .filter((item) => item.isOrphan)
    .map((item) => item.id);
}

export function getSourceTypeLabel(type: SourceItemType) {
  switch (type) {
    case "manual":
      return "手动输入";
    case "text":
      return "文本来源";
    case "share":
      return "分享来源";
    case "link":
      return "网页链接";
    case "image":
      return "图片 OCR";
    case "pdf":
      return "PDF 来源";
    case "email":
      return "邮件来源";
    default:
      return "未知来源";
  }
}

export function getShortSourceTypeLabel(type?: SourceItemType) {
  switch (type) {
    case "email":
      return "邮件";
    case "image":
      return "OCR";
    case "link":
      return "链接";
    case "pdf":
      return "PDF";
    case "share":
      return "分享";
    case "manual":
      return "手动";
    case "text":
    default:
      return "文本";
  }
}

function getPreview(source: SourceItem) {
  const raw = source.rawContent?.trim();
  if (raw) return raw;
  if (typeof source.metadata?.url === "string") return source.metadata.url;
  return "没有可预览的原文。";
}
