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
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={[styles.taskRow, { borderBottomColor: colors.icon }]}>
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
          {task.status === "done" && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <ThemedText
          style={[
            styles.taskTitle,
            task.status === "done" && styles.taskDone,
          ]}
          numberOfLines={1}
        >
          {task.title}
        </ThemedText>
        {task.dueAt && (
          <ThemedText style={styles.taskDue}>
            {new Date(task.dueAt).toLocaleDateString()}
          </ThemedText>
        )}
      </View>

      <TouchableOpacity
        onPress={() => onDelete(task.id)}
        style={styles.deleteTouch}
      >
        <Text style={[styles.deleteText, { color: colors.icon }]}>✕</Text>
      </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    flexShrink: 1,
  },
  taskDone: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  taskDue: {
    fontSize: 13,
    opacity: 0.5,
  },
  deleteTouch: {
    padding: 8,
    marginLeft: 4,
  },
  deleteText: {
    fontSize: 16,
  },
});
