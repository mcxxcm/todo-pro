import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Modal,
  View,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useTasks } from "@/hooks/useTasks";
import { useTaskExtraction } from "@/hooks/useTaskExtraction";
import { useImageOCR } from "@/hooks/useImageOCR";
import { useDraftCount } from "@/providers/DraftCountContext";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TaskComposer } from "@/components/TaskComposer";
import { TaskList } from "@/components/TaskList";
import { TaskFilterRail } from "@/components/TaskFilterRail";
import { SourceEvidenceTray } from "@/components/SourceEvidenceTray";
import { TaskBriefingPanel } from "@/components/TaskBriefingPanel";
import { FilterSidebar } from "@/components/WorkspaceSidebar";
import { InboxHeader } from "@/components/inbox/InboxHeader";
import { XPBar } from "@/components/XPBar";
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
import { Glass, Spacing, Radius, StatusColors } from "@/constants/tokens";
import { GlassCard } from "@/components/ui/GlassCard";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { SourceItemType } from "@/types/source";
import { classifyIntake } from "@/domain/intake";
import { buildTaskBriefing } from "@/domain/taskBriefing";
import {
  getTaskGroupCounts,
  type TaskGroupFilter,
} from "@/domain/taskGrouping";
import { computeXpStatus } from "@/domain/xpLevel";
import { parseManualTaskInput } from "@/lib/manualTaskInput";
import type { TaskPriority } from "@/types/task";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null);
  const [composerPriority, setComposerPriority] = useState<TaskPriority>("none");
  const [reviewPanelVisible, setReviewPanelVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const incomingShareHandledRef = useRef(false);
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(1);
  const prevOpenTaskCount = useRef(openTaskCount);
  const prevLevel = useRef(1);

  useEffect(() => {
    if (prevOpenTaskCount.current > 0 && openTaskCount === 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2500);
      return () => clearTimeout(timer);
    }
    prevOpenTaskCount.current = openTaskCount;
  }, [openTaskCount]);

  useEffect(() => {
    const { level } = computeXpStatus(tasks);
    if (level > prevLevel.current) {
      setLevelUpLevel(level);
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 2500);
      prevLevel.current = level;
      return () => clearTimeout(timer);
    }
    prevLevel.current = level;
  }, [tasks]);
  const briefing = useMemo(() => buildTaskBriefing(tasks), [tasks]);
  const taskGroupCounts = useMemo(() => getTaskGroupCounts(tasks), [tasks]);
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const task of tasks) {
      for (const tag of task.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [tasks]);
  const displayTasks = useMemo(() => {
    let result = tasks;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)),
      );
    }
    if (activeTag) {
      result = result.filter((t) => t.tags.includes(activeTag));
    }
    if (priorityFilter) {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    return result;
  }, [tasks, searchQuery, activeTag, priorityFilter]);

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

  const { ocrScanning, processImage } = useImageOCR({
    onTextExtracted: (text) => handleExtract(text, "image"),
  });
  const { setDraftCount } = useDraftCount();

  useEffect(() => {
    setDraftCount(candidates.length);
  }, [candidates.length, setDraftCount]);

  const handleManualAdd = useCallback(async (text: string, priority?: TaskPriority, pickerDueAt?: string, pickerDueText?: string, manualTags?: string[]) => {
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

    const useDueAt = pickerDueAt || parsed?.dueAt;
    const useDueText = pickerDueText || parsed?.dueText;

    const savedTask = await addTask(parsed?.title ?? text.trim(), {
      dueAt: useDueAt,
      dueText: useDueText,
      sourceId: source.id,
      sourceText: text.trim(),
      sourceType: source.type,
      timeStatus: useDueAt ? (pickerDueAt ? "needs_review" : parsed?.timeStatus ?? "needs_review") : "none",
      priority: priority && priority !== "none" ? priority : undefined,
      tags: manualTags,
    });

    if (!savedTask) {
      await deleteLocalSource(source.id);
    }

    return savedTask;
  }, [addTask]);

  const enterSelectionMode = useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) {
          setSelectionMode(false);
        }
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBatchComplete = useCallback(async () => {
    for (const id of selectedIds) {
      const task = tasks.find((t) => t.id === id);
      if (task && task.status !== "done") {
        await toggleDone(id);
      }
    }
    exitSelectionMode();
  }, [selectedIds, tasks, toggleDone, exitSelectionMode]);

  const handleBatchDelete = useCallback(async () => {
    for (const id of selectedIds) {
      await removeTask(id);
    }
    exitSelectionMode();
  }, [selectedIds, removeTask, exitSelectionMode]);

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
    if (Platform.OS === "web" || incomingShareHandledRef.current) return;

    incomingShareHandledRef.current = true;

    async function processIncomingShare() {
      try {
        const payloads = await Sharing.getResolvedSharedPayloadsAsync();
        if (!payloads.length) return;

        for (const payload of payloads) {
          const sharedTextValue =
            payload.shareType === "text" || payload.shareType === "url"
              ? payload.value?.trim()
              : "";

          if (sharedTextValue) {
            await handleExtract(sharedTextValue, "share");
            break;
          }

          if (
            payload.contentUri &&
            (payload.shareType === "image" || payload.contentType === "image")
          ) {
            const imageBase64 = await FileSystem.readAsStringAsync(
              payload.contentUri,
              { encoding: FileSystem.EncodingType.Base64 },
            );
            await extractFromImage(imageBase64);
            break;
          }
        }
      } catch (e) {
        console.warn("[incoming-share] Failed to process shared payload:", e);
      } finally {
        try {
          Sharing.clearSharedPayloads();
        } catch {
          // Some platforms expose only outbound sharing.
        }
      }
    }

    void processIncomingShare();
  }, [extractFromImage, handleExtract]);

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
          <FilterSidebar
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

          <XPBar tasks={tasks} />

          <TaskList
            header={
              <>
                <TaskComposer
                  onAdd={handleManualAdd}
                  onExtract={(text) => handleExtract(text, "text")}
                  extracting={extracting}
                  onImagePicked={processImage}
                  ocrScanning={ocrScanning}
                  priority={composerPriority}
                  onPriorityChange={setComposerPriority}
                  availableTags={availableTags}
                />

                {!wideLayout && (
                  <View style={styles.searchRow}>
                    <MaterialIcons name="search" size={16} color={colors.icon} style={styles.searchIcon} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text, backgroundColor: Glass.inputBackground[colorScheme], borderColor: Glass.border[colorScheme] }]}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="搜索任务..."
                      placeholderTextColor={colors.icon}
                      returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => { setSearchQuery(""); setActiveTag(null); }} style={styles.searchClear}>
                        <MaterialIcons name="close" size={14} color={colors.icon} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

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
                    availableTags={availableTags}
                    activeTag={activeTag}
                    onTagChange={setActiveTag}
                    priorityFilter={priorityFilter}
                    onPriorityChange={setPriorityFilter}
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
            tasks={displayTasks}
            loading={loading}
            onToggle={toggleDone}
            onUpdate={updateTask}
            onDelete={removeTask}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onLongPress={enterSelectionMode}
            onToggleSelection={toggleSelection}
          />

          {selectionMode && (
            <View style={[styles.batchBar, { backgroundColor: Glass.inputBackground[colorScheme], borderColor: colors.tint }]}>
              <TouchableOpacity onPress={exitSelectionMode} style={styles.batchCancel}>
                <ThemedText style={[styles.batchCancelText, { color: colors.icon }]}>取消</ThemedText>
              </TouchableOpacity>
              <ThemedText style={[styles.batchCount, { color: colors.text }]}>
                已选 {selectedIds.size} 项
              </ThemedText>
              <TouchableOpacity
                onPress={() => void handleBatchComplete()}
                style={[styles.batchAction, { borderColor: StatusColors.success }]}
              >
                <MaterialIcons name="check-circle" size={16} color={StatusColors.success} />
                <ThemedText style={[styles.batchActionText, { color: StatusColors.success }]}>完成</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void handleBatchDelete()}
                style={[styles.batchAction, { borderColor: StatusColors.danger }]}
              >
                <MaterialIcons name="delete" size={16} color={StatusColors.danger} />
                <ThemedText style={[styles.batchActionText, { color: StatusColors.danger }]}>删除</ThemedText>
              </TouchableOpacity>
            </View>
          )}

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
      {showCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <View style={[styles.celebrationCard, { backgroundColor: Glass.inputBackground[colorScheme], borderColor: colors.tint }]}>
            <MaterialIcons name="celebration" size={32} color={colors.tint} />
            <ThemedText style={styles.celebrationTitle}>全部完成!</ThemedText>
            <ThemedText style={styles.celebrationSub}>干得漂亮，所有任务都清空了</ThemedText>
          </View>
        </View>
      )}
      {showLevelUp && (
        <View style={styles.celebrationOverlay} pointerEvents="none">
          <View style={[styles.celebrationCard, { backgroundColor: Glass.inputBackground[colorScheme], borderColor: colors.tint }]}>
            <MaterialIcons name="bolt" size={32} color={colors.tint} />
            <ThemedText style={styles.celebrationTitle}>升级!</ThemedText>
            <ThemedText style={styles.celebrationSub}>达到 Lv.{levelUpLevel}</ThemedText>
          </View>
        </View>
      )}
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  searchIcon: {
    position: "absolute",
    left: Spacing.sm,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    paddingLeft: 34,
    paddingRight: 34,
    paddingVertical: 0,
  },
  searchClear: {
    position: "absolute",
    right: Spacing.xs,
    padding: 4,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 999,
  },
  celebrationCard: {
    alignItems: "center",
    borderRadius: Radius.card,
    borderWidth: 2,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xl,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: Spacing.xs,
  },
  celebrationSub: {
    fontSize: 14,
    fontWeight: "700",
    opacity: 0.7,
  },
  batchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    marginBottom: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  batchCancel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  batchCancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  batchCount: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  batchAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  batchActionText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
