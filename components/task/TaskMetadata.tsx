import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { Opacity, Spacing, StatusColors } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NormalizedTask } from "@/types/task";

export function TaskMetadata({
  expanded,
  hasDetails,
  onConfirmTime,
  sourceLabel,
  task,
}: {
  expanded: boolean;
  hasDetails: boolean;
  onConfirmTime: () => void;
  sourceLabel: string;
  task: NormalizedTask;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <View style={styles.taskMeta}>
      {task.dueAt && (
        <ThemedText style={styles.taskDue}>
          {new Date(task.dueAt).toLocaleDateString()}
        </ThemedText>
      )}
      {task.dueText && (
        <ThemedText style={styles.taskDue}>
          {task.dueText}
        </ThemedText>
      )}
      {task.dueText && task.timeStatus === "needs_review" && (
        <TouchableOpacity
          onPress={onConfirmTime}
          activeOpacity={0.7}
          accessibilityLabel="确认任务时间"
          style={styles.timeReviewChip}
        >
          <MaterialIcons name="help-outline" size={12} color={StatusColors.warning} />
          <Text style={styles.timeReviewText}>确认时间</Text>
        </TouchableOpacity>
      )}
      {task.dueText && task.timeStatus === "confirmed" && (
        <View style={styles.timeConfirmedChip}>
          <MaterialIcons name="check-circle-outline" size={12} color={StatusColors.success} />
          <Text style={styles.timeConfirmedText}>时间已确认</Text>
        </View>
      )}
      {task.priority !== "none" && (
        <View style={styles.priorityChip}>
          <MaterialIcons
            name={task.priority === "high" ? "priority-high" : "flag"}
            size={12}
            color={task.priority === "high" ? StatusColors.danger : colors.icon}
          />
          <Text
            style={[
              styles.priorityText,
              {
                color: task.priority === "high" ? StatusColors.danger : colors.icon,
              },
            ]}
          >
            {getPriorityLabel(task.priority)}
          </Text>
        </View>
      )}
      <View style={styles.sourceChip}>
        <MaterialIcons
          name={task.sourceType === "image" ? "image" : task.sourceId ? "verified" : "edit-note"}
          size={13}
          color={colors.icon}
        />
        <Text style={[styles.sourceChipText, { color: colors.icon }]}>
          {sourceLabel}
        </Text>
      </View>
      {hasDetails && (
        <Text style={[styles.expandHint, { color: colors.tint }]}>
          {expanded ? "收起" : "详情"}
        </Text>
      )}
    </View>
  );
}

function getPriorityLabel(priority: NormalizedTask["priority"]): string {
  switch (priority) {
    case "high":
      return "高优先级";
    case "medium":
      return "中优先级";
    case "low":
      return "低优先级";
    case "none":
    default:
      return "无优先级";
  }
}

const styles = StyleSheet.create({
  expandHint: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  priorityChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  sourceChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  sourceChipText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  taskDue: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
    opacity: Opacity.muted,
  },
  taskMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: 2,
  },
  timeConfirmedChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  timeConfirmedText: {
    color: StatusColors.success,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  timeReviewChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  timeReviewText: {
    color: StatusColors.warning,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});
