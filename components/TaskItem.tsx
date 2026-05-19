import { useState } from "react";
import { StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { NormalizedTask } from "@/types/task";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TaskItemProps {
  task: NormalizedTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const hasDetails = !!(task.notes || task.sourceText);
  const toggleExpand = () => setExpanded((v) => !v);

  return (
    <ThemedView style={{ borderBottomColor: colors.icon }}>
      <View style={styles.taskRow}>
        <TouchableOpacity
          onPress={() => onToggle(task.id)}
          style={styles.checkboxTouch}
        >
          <View
            style={[
              styles.checkbox,
              task.status === "done" && {
                backgroundColor: colors.tint,
                borderColor: colors.tint,
              },
            ]}
          >
            {task.status === "done" && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.taskContent}
          onPress={hasDetails ? toggleExpand : undefined}
          activeOpacity={hasDetails ? 0.6 : 1}
        >
          <ThemedText
            style={[
              styles.taskTitle,
              task.status === "done" && styles.taskDone,
            ]}
            numberOfLines={expanded ? undefined : 1}
          >
            {task.title}
          </ThemedText>
          <View style={styles.taskMeta}>
            {task.dueAt && (
              <ThemedText style={styles.taskDue}>
                {new Date(task.dueAt).toLocaleDateString()}
              </ThemedText>
            )}
            {hasDetails && (
              <Text style={[styles.expandHint, { color: colors.tint }]}>
                {expanded ? "收起" : "详情"}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDelete(task.id)}
          style={styles.deleteTouch}
        >
          <Text style={[styles.deleteText, { color: colors.icon }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {expanded && hasDetails && (
        <View style={styles.detailsContainer}>
          {task.notes && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.tint }]}>
                备注
              </Text>
              <ThemedText style={styles.detailValue}>{task.notes}</ThemedText>
            </View>
          )}
          {task.sourceText && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.tint }]}>
                来源
              </Text>
              <ThemedText style={styles.detailValue}>
                {task.sourceText}
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkboxTouch: {
    padding: 4,
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#999",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  taskContent: {
    flex: 1,
    paddingVertical: 2,
  },
  taskTitle: {
    fontSize: 16,
  },
  taskDone: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  taskDue: {
    fontSize: 13,
    opacity: 0.5,
  },
  expandHint: {
    fontSize: 13,
    fontWeight: "500",
  },
  deleteTouch: {
    padding: 8,
    marginLeft: 4,
  },
  deleteText: {
    fontSize: 16,
  },
  detailsContainer: {
    paddingHorizontal: 4,
    paddingBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    minWidth: 40,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    opacity: 0.6,
  },
});
