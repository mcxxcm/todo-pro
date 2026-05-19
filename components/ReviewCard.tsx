import { useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  TextInput,
} from "react-native";
import { ExtractedTask } from "@/types/extraction";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface ReviewCardProps {
  task: ExtractedTask;
  onConfirm: (task: ExtractedTask) => void;
  onDismiss: (taskId: string) => void;
  onFieldChange?: (id: string, field: "title" | "dueText", value: string) => void;
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

  // Reset local state when a new extraction comes in
  useEffect(() => {
    setEditTitle(task.title);
    setEditDueText(task.dueText ?? "");
  }, [task.id, task.title, task.dueText]);

  const titleEmpty = !editTitle.trim();

  const handleChangeTitle = (text: string) => {
    setEditTitle(text);
    onFieldChange?.(task.id, "title", text);
  };

  const handleChangeDueText = (text: string) => {
    setEditDueText(text);
    onFieldChange?.(task.id, "dueText", text);
  };

  const handleConfirm = () => {
    onConfirm({
      ...task,
      title: editTitle,
      dueText: editDueText || undefined,
    });
  };

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
      <TextInput
        style={[
          styles.titleInput,
          {
            color: colors.text,
            borderBottomColor: colors.icon,
          },
        ]}
        value={editTitle}
        onChangeText={handleChangeTitle}
        placeholder="任务标题"
        placeholderTextColor={colors.icon}
        returnKeyType="next"
      />

      <ThemedText style={styles.sourceText} numberOfLines={2}>
        {task.sourceText}
      </ThemedText>

      <View style={styles.dueRow}>
        <TextInput
          style={[
            styles.dueInput,
            {
              color: colors.text,
              borderBottomColor: colors.icon,
            },
          ]}
          value={editDueText}
          onChangeText={handleChangeDueText}
          placeholder="添加截止日期..."
          placeholderTextColor={colors.icon}
          returnKeyType="done"
        />
      </View>

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
          onPress={handleConfirm}
          disabled={titleEmpty}
          style={[
            styles.actionBtn,
            styles.confirmBtn,
            titleEmpty && styles.confirmDisabled,
          ]}
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
  titleInput: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 4,
    borderBottomWidth: 1,
    marginBottom: 6,
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
  dueInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
    borderBottomWidth: 1,
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
  confirmDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
