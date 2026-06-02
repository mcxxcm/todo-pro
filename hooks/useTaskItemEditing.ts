import { useEffect, useState } from "react";

import { parseClientDateInfo } from "@/lib/clientTimeParser";
import type { NormalizedTask, TaskPriority, TaskUpdateInput } from "@/types/task";

export function useTaskItemEditing({
  onUpdate,
  task,
}: {
  onUpdate: (id: string, patch: TaskUpdateInput) => void | Promise<void>;
  task: NormalizedTask;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDueText, setDraftDueText] = useState(task.dueText ?? "");
  const [draftNotes, setDraftNotes] = useState(task.notes ?? "");
  const [draftPriority, setDraftPriority] = useState<TaskPriority>(task.priority ?? "none");
  const [draftTags, setDraftTags] = useState<string[]>(task.tags ?? []);

  const saveDisabled = saving || !draftTitle.trim();

  const resetDrafts = () => {
    setDraftTitle(task.title);
    setDraftDueText(task.dueText ?? "");
    setDraftNotes(task.notes ?? "");
    setDraftPriority(task.priority ?? "none");
    setDraftTags(task.tags ?? []);
  };

  useEffect(() => {
    if (!editing) {
      setDraftTitle(task.title);
      setDraftDueText(task.dueText ?? "");
      setDraftNotes(task.notes ?? "");
      setDraftPriority(task.priority ?? "none");
      setDraftTags(task.tags ?? []);
    }
  }, [editing, task.dueText, task.id, task.notes, task.priority, task.tags, task.title]);

  const startEditing = () => {
    resetDrafts();
    setEditing(true);
  };

  const cancelEditing = () => {
    resetDrafts();
    setEditing(false);
  };

  const saveEditing = async () => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) return;

    const nextDueText = draftDueText.trim();
    const previousDueText = task.dueText ?? "";
    const dueTextChanged = nextDueText !== previousDueText;
    const parsedDue = dueTextChanged && nextDueText
      ? parseClientDateInfo(nextDueText)
      : null;

    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: nextTitle,
        dueText: (parsedDue?.dueText ?? nextDueText) || undefined,
        dueAt: nextDueText
          ? dueTextChanged
            ? parsedDue?.dueAt
            : task.dueAt
          : undefined,
        timeStatus: nextDueText
          ? dueTextChanged
            ? "needs_review"
            : task.timeStatus ?? "confirmed"
          : "none",
        notes: draftNotes.trim() || undefined,
        priority: draftPriority !== "none" ? draftPriority : undefined,
        tags: draftTags.length > 0 ? draftTags : undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return {
    cancelEditing,
    draftDueText,
    draftNotes,
    draftPriority,
    draftTags,
    draftTitle,
    editing,
    saveDisabled,
    saveEditing,
    saving,
    setDraftDueText,
    setDraftNotes,
    setDraftPriority,
    setDraftTags,
    setDraftTitle,
    startEditing,
  };
}
