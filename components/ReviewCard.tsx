import { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  TextInput,
} from "react-native";
import { ExtractedTask } from "@/types/extraction";
import { TaskDraftStatus } from "@/types/draft";
import type { SourceItemType } from "@/types/source";
import { TimeStatus } from "@/types/task";
import { ThemedText } from "@/components/themed-text";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing, StatusColors } from "@/constants/tokens";
import { getShortSourceTypeLabel } from "@/domain/sourceTimeline";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { parseClientDateInfo } from "@/lib/clientTimeParser";

interface ReviewCardProps {
  task: ExtractedTask & {
    sourceType?: SourceItemType;
    status?: TaskDraftStatus;
  };
  onConfirm: (task: ExtractedTask) => void;
  onDismiss: (taskId: string) => void;
  onFieldChange?: (
    id: string,
    field: "title" | "dueText" | "dueAt" | "timeStatus",
    value: string | undefined,
  ) => void;
}

export function ReviewCard({
  task,
  onConfirm,
  onDismiss,
  onFieldChange,
}: ReviewCardProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDueText, setEditDueText] = useState(task.dueText ?? "");
  const [editTimeStatus, setEditTimeStatus] = useState<TimeStatus>(
    task.timeStatus ?? (task.dueText ? "needs_review" : "none"),
  );

  // Reset local state when a new extraction comes in
  useEffect(() => {
    setEditTitle(task.title);
    setEditDueText(task.dueText ?? "");
    setEditTimeStatus(task.timeStatus ?? (task.dueText ? "needs_review" : "none"));
  }, [task.id, task.title, task.dueText, task.timeStatus]);

  const titleEmpty = !editTitle.trim();
  const hasDueText = !!editDueText.trim();
  const timeNeedsReview = hasDueText && editTimeStatus === "needs_review";

  const handleChangeTitle = (text: string) => {
    setEditTitle(text);
    onFieldChange?.(task.id, "title", text);
  };

  const handleChangeDueText = (text: string) => {
    setEditDueText(text);
    onFieldChange?.(task.id, "dueText", text);
    if (text.trim() !== (task.dueText ?? "")) {
      onFieldChange?.(task.id, "dueAt", undefined);
    }
    const nextStatus = text.trim() ? "needs_review" : "none";
    setEditTimeStatus(nextStatus);
    onFieldChange?.(task.id, "timeStatus", nextStatus);
  };

  const handleConfirmTime = () => {
    setEditTimeStatus("confirmed");
    onFieldChange?.(task.id, "timeStatus", "confirmed");
  };

  const handleConfirm = () => {
    const dueText = editDueText.trim() || undefined;
    const dueTextChanged = dueText !== task.dueText;
    const parsedDue = dueTextChanged && dueText
      ? parseClientDateInfo(dueText)
      : null;

    onConfirm({
      ...task,
      title: editTitle.trim(),
      dueText: parsedDue?.dueText ?? dueText,
      dueAt: dueText
        ? dueTextChanged
          ? parsedDue?.dueAt
          : task.dueAt
        : undefined,
      timeStatus: dueText ? editTimeStatus : "none",
    });
  };

  const confidenceLabel =
    task.confidence !== undefined
      ? `${Math.round(task.confidence * 100)}%`
      : "待判断";
  const draftStatusLabel = task.status === "edited" ? "已编辑" : "待审核";
  const sourceTypeLabel = getShortSourceTypeLabel(task.sourceType);

  return (
    <GlassCard
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`AI 草稿: ${task.title}`}
      accessibilityHint="可以编辑标题和时间，然后确认保存或忽略"
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLabel}>
          <MaterialIcons name="auto-awesome" size={15} color={colors.tint} />
          <Text style={[styles.headerLabelText, { color: colors.tint }]}>
            AI 草稿
          </Text>
          <Text style={[styles.headerSourceText, { color: colors.icon }]}>
            {sourceTypeLabel}
          </Text>
        </View>
        <View
          style={[
            styles.confidencePill,
            {
              borderColor: Glass.border[colorScheme],
              backgroundColor: Glass.inputBackground[colorScheme],
            },
          ]}
        >
          <Text style={[styles.statusText, { color: colors.icon }]}>
            {draftStatusLabel}
          </Text>
          <Text style={[styles.confidenceText, { color: colors.icon }]}>
            {confidenceLabel}
          </Text>
        </View>
      </View>

      <TextInput
        style={[
          styles.titleInput,
          {
            color: colors.text,
            backgroundColor: Glass.inputBackground[colorScheme],
            borderColor: Glass.border[colorScheme],
          },
        ]}
        value={editTitle}
        onChangeText={handleChangeTitle}
        placeholder="任务标题"
        placeholderTextColor={colors.icon}
        accessibilityLabel="候选任务标题"
        returnKeyType="next"
      />

      <View
        style={[
          styles.sourcePanel,
          {
            borderColor: Glass.border[colorScheme],
            backgroundColor:
              colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.035)"
                : "rgba(255, 255, 255, 0.48)",
          },
        ]}
      >
        <View style={styles.sourceHeader}>
          <MaterialIcons name="article" size={14} color={colors.icon} />
          <Text style={[styles.sourceLabel, { color: colors.icon }]}>
            来源证据
          </Text>
        </View>
        <ThemedText style={styles.sourceText} numberOfLines={3}>
          {task.sourceText}
        </ThemedText>
      </View>

      <View style={styles.dueRow}>
        <MaterialIcons name="schedule" size={17} color={colors.icon} />
        <TextInput
          style={[
            styles.dueInput,
            {
              color: colors.text,
              backgroundColor: Glass.inputBackground[colorScheme],
              borderColor: Glass.border[colorScheme],
            },
          ]}
          value={editDueText}
          onChangeText={handleChangeDueText}
          placeholder="添加截止日期..."
          placeholderTextColor={colors.icon}
          accessibilityLabel="候选任务时间"
          returnKeyType="done"
        />
      </View>

      {hasDueText && (
        <View
          style={[
            styles.timeReviewRow,
            {
              borderColor: Glass.border[colorScheme],
              backgroundColor:
                editTimeStatus === "confirmed"
                  ? "rgba(52, 199, 89, 0.10)"
                  : "rgba(255, 149, 0, 0.10)",
            },
          ]}
        >
          <View style={styles.timeStatusCluster}>
            <MaterialIcons
              name={timeNeedsReview ? "help-outline" : "check-circle-outline"}
              size={15}
              color={timeNeedsReview ? "#ffb340" : "#39c56a"}
            />
          <ThemedText
            style={[
              styles.timeReviewLabel,
              editTimeStatus === "confirmed" && styles.timeConfirmedLabel,
            ]}
          >
            {timeNeedsReview ? "时间待确认" : "时间已确认"}
          </ThemedText>
          </View>
          {timeNeedsReview && (
            <TouchableOpacity
              onPress={handleConfirmTime}
              style={[
                styles.timeConfirmButton,
                { borderColor: colors.tint },
              ]}
              activeOpacity={0.7}
              accessibilityLabel="确认候选任务时间"
            >
              <Text style={[styles.timeConfirmText, { color: colors.tint }]}>
                确认时间
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {task.notes ? (
        <ThemedText style={styles.notesText} numberOfLines={3}>
          {task.notes}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onDismiss(task.id)}
          style={[styles.actionBtn, styles.dismissBtn]}
          activeOpacity={0.7}
          accessibilityLabel="忽略候选任务"
        >
          <MaterialIcons name="close" size={15} color={colors.icon} />
          <Text style={[styles.actionText, { color: colors.icon }]}>
            忽略
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={titleEmpty}
          style={[
            styles.actionBtn,
            styles.confirmBtn,
            { backgroundColor: colors.tint },
            titleEmpty && styles.confirmDisabled,
          ]}
          activeOpacity={0.7}
          accessibilityLabel="确认保存候选任务"
        >
          <MaterialIcons
            name="check"
            size={16}
            color={colorScheme === "dark" ? "#11181C" : "#fff"}
          />
          <Text
            style={[
              styles.confirmText,
              colorScheme === "dark" && styles.confirmTextDark,
            ]}
          >
            确认保存
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  headerLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xxs,
  },
  headerLabelText: {
    fontSize: 12,
    fontWeight: "900",
  },
  headerSourceText: {
    fontSize: 11,
    fontWeight: "800",
  },
  confidencePill: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  confidenceText: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  titleInput: {
    fontSize: 16,
    fontWeight: "800",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 42,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  sourcePanel: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  sourceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xxs,
    marginBottom: 3,
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: "900",
    opacity: Opacity.subtle,
  },
  sourceText: {
    fontSize: 12,
    lineHeight: 17,
    opacity: Opacity.muted,
  },
  dueRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dueInput: {
    flex: 1,
    fontSize: 14,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 38,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  notesText: {
    fontSize: 13,
    opacity: Opacity.muted,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  timeReviewLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: StatusColors.warning,
  },
  timeConfirmedLabel: {
    color: StatusColors.success,
  },
  timeReviewRow: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  timeStatusCluster: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xxs,
  },
  timeConfirmButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  timeConfirmText: {
    fontSize: 12,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.xs,
  },
  actionBtn: {
    alignItems: "center",
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.xxs,
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  dismissBtn: {
    backgroundColor: "transparent",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "800",
  },
  confirmBtn: {
    justifyContent: "center",
  },
  confirmDisabled: {
    opacity: Opacity.disabled,
  },
  confirmText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  confirmTextDark: {
    color: "#11181C",
  },
});
