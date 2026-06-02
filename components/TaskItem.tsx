import { useEffect, useRef, useState } from "react";
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
  Text,
  Platform,
} from "react-native";
import { NormalizedTask, TaskUpdateInput } from "@/types/task";
import { ThemedText } from "@/components/themed-text";
import { priorityColor } from "@/components/task/PriorityPicker";
import { TaskDetailModal } from "@/components/task/TaskDetailModal";
import { TaskMetadata } from "@/components/task/TaskMetadata";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { getSourceTypeLabel } from "@/domain/sourceTimeline";
import { computeTaskXp } from "@/domain/xpLevel";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TaskItemProps {
  task: NormalizedTask;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: TaskUpdateInput) => void | Promise<void>;
  onDelete: (id: string) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onLongPress?: (id: string) => void;
  onToggleSelection?: (id: string) => void;
}

export function TaskItem({ task, onToggle, onUpdate, onDelete, selectionMode, selected, onLongPress, onToggleSelection }: TaskItemProps) {
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailStartInEdit, setDetailStartInEdit] = useState(false);
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
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
  const burstScale = useSharedValue(0);
  const burstOpacity = useSharedValue(0);
  const xpFloatY = useSharedValue(0);
  const xpFloatOpacity = useSharedValue(0);
  const xpGained = useRef(0);

  useEffect(() => {
    titleOpacity.value = withTiming(task.status === "done" ? 0.5 : 1, { duration: 300 });
  }, [task.status, titleOpacity]);

  const handleToggle = () => {
    const completing = task.status !== "done";
    if (Platform.OS !== "web") {
      Haptics.impactAsync(
        completing ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
      );
    }
    // Bouncy scale animation
    checkScale.value = withSequence(
      withTiming(0.7, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    // Burst animation on completion
    if (completing) {
      burstScale.value = 0;
      burstOpacity.value = 1;
      burstScale.value = withTiming(3, { duration: 400 });
      burstOpacity.value = withTiming(0, { duration: 400 });
      // XP float animation
      xpGained.current = computeTaskXp(task);
      xpFloatY.value = 0;
      xpFloatOpacity.value = 1;
      xpFloatY.value = withTiming(-40, { duration: 1200 });
      xpFloatOpacity.value = withTiming(0, { duration: 1200 });
    }
    onToggle(task.id);
  };

  const handleOpenDetail = (startInEdit = false) => {
    setDetailStartInEdit(startInEdit);
    setDetailVisible(true);
  };

  const animatedCheckboxStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkScale.value }],
    };
  });

  const animatedBurstStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: burstScale.value }],
      opacity: burstOpacity.value,
    };
  });

  const animatedXpFloatStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: xpFloatY.value }],
      opacity: xpFloatOpacity.value,
    };
  });

  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
    };
  });

  return (
    <GlassCard style={[styles.taskSurface, selected && { borderColor: colors.tint, borderWidth: 1.5 }]}>
      <View
        style={[
          styles.taskRow,
        ]}
      >
        {task.priority && task.priority !== "none" && (
          <View style={[styles.priorityBar, { backgroundColor: priorityColor(task.priority, colorScheme) }]} />
        )}
        {selectionMode ? (
          <TouchableOpacity
            onPress={() => onToggleSelection?.(task.id)}
            style={styles.checkboxTouch}
            accessibilityLabel={selected ? "取消选择" : "选择"}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
          >
            <MaterialIcons
              name={selected ? "check-box" : "check-box-outline-blank"}
              size={20}
              color={selected ? colors.tint : colors.icon}
            />
          </TouchableOpacity>
        ) : (
        <TouchableOpacity
          onPress={handleToggle}
          style={styles.checkboxTouch}
          accessibilityLabel={task.status === "done" ? "标记为未完成" : "标记为完成"}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.status === "done" }}
          activeOpacity={0.8}
        >
          <View style={styles.checkboxContainer}>
            <Animated.View
              style={[
                styles.burstRing,
                {
                  borderColor: colors.tint,
                },
                animatedBurstStyle,
              ]}
            />
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
            <Animated.View style={[styles.xpFloat, animatedXpFloatStyle]} pointerEvents="none">
              <Text style={[styles.xpFloatText, { color: colors.tint }]}>
                +{xpGained.current} XP
              </Text>
            </Animated.View>
          </View>
        </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.taskContent}
          onPress={selectionMode ? () => onToggleSelection?.(task.id) : () => handleOpenDetail()}
          activeOpacity={0.6}
          onLongPress={selectionMode ? undefined : () => onLongPress?.(task.id)}
          accessibilityLabel={`查看任务: ${task.title}`}
          accessibilityRole="button"
        >
          <Animated.View style={[animatedTitleStyle, styles.titleRow]}>
            {task.recurrence && (
              <MaterialIcons name="repeat" size={12} color={colors.tint} style={styles.recurrenceIcon} />
            )}
            <ThemedText
              style={[
                styles.taskTitle,
                task.status === "done" && styles.taskDone,
              ]}
              numberOfLines={1}
            >
              {task.title}
            </ThemedText>
          </Animated.View>
          <TaskMetadata
            expanded={false}
            hasDetails={!!(task.notes || task.sourceText)}
            onConfirmTime={() => void onUpdate(task.id, { timeStatus: "confirmed" })}
            sourceLabel={sourceLabel}
            task={task}
          />
        </TouchableOpacity>

        {!selectionMode && (
        <View style={styles.rowActions}>
          <TouchableOpacity
            onPress={() => handleOpenDetail(true)}
            style={[
              styles.actionIconBtn,
              { backgroundColor: Glass.inputBackground[colorScheme], borderColor: Glass.border[colorScheme] },
            ]}
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
        )}
      </View>

      {!selectionMode && (
      <TaskDetailModal
        visible={detailVisible}
        task={task}
        onClose={() => setDetailVisible(false)}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onToggleDone={onToggle}
        startInEdit={detailStartInEdit}
      />
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  taskSurface: {
    borderRadius: Radius.card,
  },
  priorityBar: {
    width: 4,
    borderRadius: 2,
    marginRight: Spacing.xxs,
    alignSelf: "stretch",
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
  checkboxContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  burstRing: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
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
  xpFloat: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -24,
  },
  xpFloatText: {
    fontSize: 12,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  taskContent: {
    flex: 1,
    paddingVertical: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  recurrenceIcon: {
    marginRight: 4,
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
