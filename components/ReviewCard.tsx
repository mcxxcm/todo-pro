import { StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { ExtractedTask } from "@/types/extraction";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface ReviewCardProps {
  task: ExtractedTask;
  onConfirm: (task: ExtractedTask) => void;
  onDismiss: (taskId: string) => void;
}

export function ReviewCard({ task, onConfirm, onDismiss }: ReviewCardProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
          borderColor: colors.icon,
        },
      ]}
    >
      <ThemedText style={styles.title} numberOfLines={2}>
        {task.title}
      </ThemedText>

      <ThemedText style={styles.sourceText} numberOfLines={2}>
        {task.sourceText}
      </ThemedText>

      {task.dueText && (
        <View style={styles.dueRow}>
          <Text style={[styles.dueBadge, { color: colors.tint }]}>
            {task.dueText}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onDismiss(task.id)}
          style={[styles.actionBtn, styles.dismissBtn]}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: colors.icon }]}>
            忽略
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onConfirm(task)}
          style={[styles.actionBtn, styles.confirmBtn]}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmText}>确认保存</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 13,
    opacity: 0.5,
    marginBottom: 8,
  },
  dueRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  dueBadge: {
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dismissBtn: {
    backgroundColor: "transparent",
  },
  actionText: {
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: "#007aff",
  },
  confirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
