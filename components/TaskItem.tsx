import { useEffect, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { NormalizedTask, TaskUpdateInput } from "@/types/task";
import { ThemedText } from "@/components/themed-text";
import { TaskDetails } from "@/components/task/TaskDetails";
import { TaskEditForm } from "@/components/task/TaskEditForm";
import { TaskMetadata } from "@/components/task/TaskMetadata";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { getSourceTypeLabel } from "@/domain/sourceTimeline";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTaskItemEditing } from "@/hooks/useTaskItemEditing";

interface TaskItemProps {
  task: NormalizedTask;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: TaskUpdateInput) => void | Promise<void>;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onUpdate, onDelete }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const hasDetails = !!(task.notes || task.sourceText);
  const {
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
  } = useTaskItemEditing({ onUpdate, task });
  const sourceLabel = task.sourceId && task.sourceType
    ? getSourceTypeLabel(task.sourceType)
    : task.sourceId
      ? "来源已归档"
    : task.sourceText
      ? "来源文本"
      : "手动";

  // Reanimated values for dopamine checkbox
  const checkScale = useSharedValue(1);
  const titleOpacity = useSharedValue(task.status === "done" ? 0.5 : 1);

  useEffect(() => {
    titleOpacity.value = withTiming(task.status === "done" ? 0.5 : 1, { duration: 300 });
  }, [task.status, titleOpacity]);

  const toggleExpand = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((v) => !v);
  };

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        task.status === "done" ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
      );
    }
    // Bouncy scale animation
    checkScale.value = withSequence(
      withTiming(0.7, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onToggle(task.id);
  };

  const animatedCheckboxStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkScale.value }],
    };
  });

  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
    };
  });

  const handleStartEditing = () => {
    setExpanded(true);
    startEditing();
  };

  return (
    <GlassCard style={styles.taskSurface}>
      <View
        style={[
          styles.taskRow,
          (editing || (expanded && hasDetails)) && {
            borderBottomColor: Glass.border[colorScheme],
            borderBottomWidth: StyleSheet.hairlineWidth,
            paddingBottom: Spacing.sm,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleToggle}
          style={styles.checkboxTouch}
          accessibilityLabel={task.status === "done" ? "标记为未完成" : "标记为完成"}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.checkbox,
              {
                borderColor: Glass.border[colorScheme],
              },
              task.status === "done" && {
                backgroundColor: colors.tint,
                borderColor: colors.tint,
              },
              animatedCheckboxStyle,
            ]}
          >
            {task.status === "done" && (
              <MaterialIcons
                name="check"
                size={13}
                color={colorScheme === "dark" ? "#0b0d0e" : "#fff"}
              />
            )}
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.taskContent}
          onPress={!editing && hasDetails ? toggleExpand : undefined}
          activeOpacity={!editing && hasDetails ? 0.6 : 1}
        >
          <Animated.View style={animatedTitleStyle}>
            <ThemedText
              style={[
                styles.taskTitle,
                task.status === "done" && styles.taskDone,
              ]}
              numberOfLines={expanded ? undefined : 1}
            >
              {task.title}
            </ThemedText>
          </Animated.View>
          <TaskMetadata
            expanded={expanded}
            hasDetails={hasDetails}
            onConfirmTime={() => void onUpdate(task.id, { timeStatus: "confirmed" })}
            sourceLabel={sourceLabel}
            task={task}
          />
        </TouchableOpacity>

        <View style={styles.rowActions}>
          <TouchableOpacity
            onPress={handleStartEditing}
            style={[
              styles.actionIconBtn,
              { backgroundColor: Glass.inputBackground[colorScheme], borderColor: Glass.border[colorScheme] },
            ]}
            disabled={editing}
            accessibilityLabel="编辑任务"
          >
            <MaterialIcons name="edit" size={14} color={colors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(task.id)}
            style={[
              styles.actionIconBtn,
              { backgroundColor: Glass.inputBackground[colorScheme], borderColor: Glass.border[colorScheme] },
            ]}
            accessibilityLabel="删除任务"
          >
            <MaterialIcons name="close" size={14} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {editing && (
        <TaskEditForm
          draftDueText={draftDueText}
          draftNotes={draftNotes}
          draftTitle={draftTitle}
          onCancel={cancelEditing}
          onChangeDueText={setDraftDueText}
          onChangeNotes={setDraftNotes}
          onChangeTitle={setDraftTitle}
          onSave={() => void saveEditing()}
          saving={saving}
          saveDisabled={saveDisabled}
        />
      )}

      {!editing && expanded && hasDetails && (
        <TaskDetails task={task} />
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  taskSurface: {
    borderRadius: Radius.card,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },
  checkboxTouch: {
    padding: Spacing.xxs,
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkmarkDark: {
    color: "#11181C",
  },
  taskContent: {
    flex: 1,
    paddingVertical: 2,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  taskDone: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: Spacing.xxs,
  },
  actionIconBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
