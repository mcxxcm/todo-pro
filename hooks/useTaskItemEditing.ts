import { useEffect, useState } from "react";

import { parseClientDateInfo } from "@/lib/clientTimeParser";
import type { NormalizedTask, TaskUpdateInput } from "@/types/task";

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

  const saveDisabled = saving || !draftTitle.trim();

  const resetDrafts = () => {
    setDraftTitle(task.title);
    setDraftDueText(task.dueText ?? "");
    setDraftNotes(task.notes ?? "");
  };

  useEffect(() => {
    if (!editing) {
      setDraftTitle(task.title);
      setDraftDueText(task.dueText ?? "");
      setDraftNotes(task.notes ?? "");
    }
  }, [editing, task.dueText, task.id, task.notes, task.title]);

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
    draftTitle,
    editing,
    saveDisabled,
    saveEditing,
    saving,
    setDraftDueText,
    setDraftNotes,
    setDraftTitle,
    startEditing,
  };
}
