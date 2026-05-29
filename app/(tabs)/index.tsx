import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTasks } from "@/hooks/useTasks";
import { useTaskExtraction } from "@/hooks/useTaskExtraction";
// import { useImageOCR } from "@/hooks/useImageOCR";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TaskComposer } from "@/components/TaskComposer";
import { TaskList } from "@/components/TaskList";
import { TaskFilterRail } from "@/components/TaskFilterRail";
import { SourceEvidenceTray } from "@/components/SourceEvidenceTray";
import { TaskBriefingPanel } from "@/components/TaskBriefingPanel";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import { InboxHeader } from "@/components/inbox/InboxHeader";
import { TimeReviewActionCard } from "@/components/inbox/TimeReviewActionCard";
import { ReviewModalContent } from "@/components/inbox/ReviewModalContent";
import { LiquidSurface } from "@/components/inbox/LiquidSurface";
import { ExtractedTask } from "@/types/extraction";
import { TaskDraft } from "@/types/draft";
import {
  createLocalSource,
  deleteLocalSource,
} from "@/providers/localSourceProvider";
import { Colors } from "@/constants/theme";
import { Spacing, Radius, StatusColors } from "@/constants/tokens";
import { GlassCard } from "@/components/ui/GlassCard";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { SourceItemType } from "@/types/source";
import { classifyIntake } from "@/domain/intake";
import { buildTaskBriefing } from "@/domain/taskBriefing";
import {
  getTaskGroupCounts,
  type TaskGroupFilter,
} from "@/domain/taskGrouping";
import { parseManualTaskInput } from "@/lib/manualTaskInput";

export default function InboxScreen() {
  const params = useLocalSearchParams<{
    text?: string | string[];
    source?: string | string[];
  }>();
  const { tasks, loading, error: tasksError, addTask, toggleDone, updateTask, removeTask, mergeDuplicates, confirmAllTimeReviews, refresh } =
    useTasks();
  const { candidates, extracting, error: extractionError, extract, extractFromImage, confirmTask, dismissTask, closePanel, updateCandidate, clearError } =
    useTaskExtraction();
  const [pendingSave, setPendingSave] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TaskGroupFilter>("all");
  const [reviewPanelVisible, setReviewPanelVisible] = useState(false);
  const lastSharedTextRef = useRef<string | null>(null);
  const currentIntakeTypeRef = useRef<SourceItemType>("text");
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const { activeTheme } = useAppTheme();
  const baseBgColor = activeTheme.colors[colorScheme].base;
  const wideLayout = width >= 980;
  const openTaskCount = tasks.filter((task) => task.status !== "done").length;
  const sourceBackedCount = tasks.filter((task) => task.sourceId || task.sourceText).length;
  const briefing = useMemo(() => buildTaskBriefing(tasks), [tasks]);
  const taskGroupCounts = useMemo(() => getTaskGroupCounts(tasks), [tasks]);

  const sharedText = Array.isArray(params.text) ? params.text[0] : params.text;
  const sourceParam = Array.isArray(params.source)
    ? params.source[0]
    : params.source;

  // --- Handlers ---

  const handleExtract = useCallback(async (text: string, intakeType: SourceItemType = "text") => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const intake = classifyIntake(trimmed, intakeType);
    currentIntakeTypeRef.current = intake.sourceType;
    clearError();
    const source = await createLocalSource({
      type: intake.sourceType,
      title: getSourceTitle(intake.titlePrefix, trimmed),
      rawContent: trimmed,
      origin: intake.sourceType,
      metadata: {
        intake: intake.sourceType,
        length: trimmed.length,
        ...(intake.url && { url: intake.url }),
      },
    });
    await extract(trimmed, {
      sourceId: source.id,
      sourceType: source.type,
    });
  }, [clearError, extract]);

  const handleManualAdd = useCallback(async (text: string) => {
    const parsed = parseManualTaskInput(text);
    if (!parsed) return undefined;
    const source = await createLocalSource({
      type: "manual",
      title: getSourceTitle("手动输入", text.trim()),
      rawContent: text.trim(),
      origin: "manual",
      metadata: {
        intake: "manual",
        length: text.trim().length,
      },
    });

    const savedTask = await addTask(parsed.title, {
      dueAt: parsed.dueAt,
      dueText: parsed.dueText,
      sourceId: source.id,
      sourceText: text.trim(),
      sourceType: source.type,
      timeStatus: parsed.timeStatus,
    });

    if (!savedTask) {
      await deleteLocalSource(source.id);
    }

    return savedTask;
  }, [addTask]);

  const ensureSourceForExtractedTask = async (
    task: ExtractedTask & Partial<Pick<TaskDraft, "sourceId" | "sourceType">>,
  ) => {
    if (task.sourceId && task.sourceType) {
      return { id: task.sourceId, type: task.sourceType };
    }

    const intakeType = currentIntakeTypeRef.current;
    return createLocalSource({
      type: intakeType,
      title: task.title,
      rawContent: task.sourceText,
      origin: intakeType,
      metadata: {
        intake: intakeType,
      },
    });
  };

  const handleConfirm = async (
    task: ExtractedTask & Partial<Pick<TaskDraft, "sourceId" | "sourceType">>,
  ) => {
    const source = await ensureSourceForExtractedTask(task);
    const savedTask = await addTask(task.title, {
      dueAt: task.dueAt,
      dueText: task.dueText,
      timeStatus: task.timeStatus,
      notes: task.notes,
      priority: task.priority,
      sourceId: source.id,
      sourceType: source.type,
      sourceText: task.sourceText,
      tags: task.tags,
      timeConfidence: task.timeConfidence,
    });
    if (!savedTask) return;
    await confirmTask(task.id, savedTask.id, {
      dueAt: task.dueAt,
      dueText: task.dueText,
      notes: task.notes,
      timeStatus: task.timeStatus,
      title: task.title,
    });
  };

  const handleConfirmAll = async () => {
    setPendingSave(true);
    try {
      for (const t of candidates) {
        const source = await ensureSourceForExtractedTask(t);
        const savedTask = await addTask(t.title, {
          dueAt: t.dueAt,
          dueText: t.dueText,
          timeStatus: t.dueText ? t.timeStatus ?? "needs_review" : "none",
          notes: t.notes,
          priority: t.priority,
          sourceId: source.id,
          sourceType: source.type,
          sourceText: t.sourceText,
          tags: t.tags,
          timeConfidence: t.timeConfidence,
        });
        if (!savedTask) continue;
        await confirmTask(t.id, savedTask.id, {
          dueAt: t.dueAt,
          dueText: t.dueText,
          notes: t.notes,
          timeStatus: t.timeStatus,
          title: t.title,
        });
      }
    } finally {
      setPendingSave(false);
    }
  };

  const handleCloseReview = useCallback(() => {
    setReviewPanelVisible(false);
    void closePanel();
  }, [closePanel]);

  // --- Effects ---

  useEffect(() => {
    if (candidates.length > 0) {
      setReviewPanelVisible(true);
    }
  }, [candidates.length]);

  useEffect(() => {
    const normalizedSharedText = sharedText?.trim();
    if (
      !normalizedSharedText ||
      lastSharedTextRef.current === normalizedSharedText
    ) {
      return;
    }

    lastSharedTextRef.current = normalizedSharedText;
    void handleExtract(
      normalizedSharedText,
      sourceParam === "share" ? "share" : "text",
    );
  }, [handleExtract, sharedText, sourceParam]);

  // --- Error state ---

  if (tasksError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.errorContainer}>
          <GlassCard style={styles.errorCard}>
            <MaterialIcons
              name="error-outline"
              size={32}
              color={StatusColors.danger}
              style={styles.errorIcon}
            />
            <ThemedText style={styles.errorText}>{tasksError}</ThemedText>
            <TouchableOpacity onPress={refresh} style={styles.retryButton}>
              <ThemedText type="link">重试</ThemedText>
            </TouchableOpacity>
          </GlassCard>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // --- Main render ---

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: baseBgColor }]}
    >
      <LiquidSurface baseColor={baseBgColor} />

      <View style={[styles.workspace, wideLayout && styles.workspaceWide]}>
        {wideLayout && (
          <WorkspaceSidebar
            activeFilter={activeFilter}
            draftCount={candidates.length}
            onFilterChange={setActiveFilter}
            onReviewPress={() => setReviewPanelVisible(true)}
            tasks={tasks}
          />
        )}

        <View style={styles.mainPane}>
          <InboxHeader
            draftCount={candidates.length}
            openTaskCount={openTaskCount}
            sourceBackedCount={sourceBackedCount}
            taskCount={tasks.length}
            wideLayout={wideLayout}
          />

          <TaskList
            header={
              <>
                <TaskComposer
                  onAdd={handleManualAdd}
                  onExtract={(text) => handleExtract(text, "text")}
                  extracting={extracting}
                  onImagePicked={extractFromImage}
                  ocrScanning={extracting} // Using extracting state for both now
                />

                <TaskBriefingPanel
                  briefing={briefing}
                  onMergeDuplicates={mergeDuplicates}
                  tasks={tasks}
                />

                {!wideLayout && (
                  <TaskFilterRail
                    activeFilter={activeFilter}
                    counts={taskGroupCounts}
                    onFilterChange={setActiveFilter}
                  />
                )}

                {activeFilter === "needsReview" && taskGroupCounts.needsReview > 0 && (
                  <TimeReviewActionCard
                    count={taskGroupCounts.needsReview}
                    onConfirmAll={() => void confirmAllTimeReviews()}
                  />
                )}

                {!!extractionError && (
                  <ThemedView style={styles.extractErrorBanner}>
                    <MaterialIcons
                      name="error-outline"
                      size={16}
                      color={StatusColors.danger}
                    />
                    <ThemedText style={styles.extractErrorText}>
                      {extractionError}
                    </ThemedText>
                  </ThemedView>
                )}
              </>
            }
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            tasks={tasks}
            loading={loading}
            onToggle={toggleDone}
            onUpdate={updateTask}
            onDelete={removeTask}
          />

          <SourceEvidenceTray tasks={tasks} candidates={candidates} />
        </View>
      </View>

      <Modal
        visible={reviewPanelVisible && candidates.length > 0}
        animationType="slide"
        transparent
        onRequestClose={handleCloseReview}
      >
        <ReviewModalContent
          candidates={candidates}
          onClose={handleCloseReview}
          onConfirm={handleConfirm}
          onConfirmAll={handleConfirmAll}
          onDismiss={(taskId) => void dismissTask(taskId)}
          onFieldChange={updateCandidate}
          pendingSave={pendingSave}
        />
      </Modal>
    </SafeAreaView>
  );
}

function getSourceTitle(prefix: string, text: string) {
  return `${prefix}: ${text.slice(0, 28)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  workspace: {
    flex: 1,
  },
  workspaceWide: {
    flexDirection: "row",
    gap: 18,
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  mainPane: {
    flex: 1,
    minWidth: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  errorCard: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
  },
  errorIcon: {
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  retryButton: {
    padding: Spacing.xs,
  },
  extractErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: `${StatusColors.danger}1A`,
    marginBottom: Spacing.xxs,
  },
  extractErrorText: {
    flex: 1,
    fontSize: 13,
    color: StatusColors.danger,
  },
});
