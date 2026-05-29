import { useEffect, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { AccessibilityInfo, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import type { TaskGroupFilter } from "@/domain/taskGrouping";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface EmptyTaskStateProps {
  activeFilter?: TaskGroupFilter;
  onShowAll?: () => void;
}

export function EmptyTaskState({
  activeFilter = "all",
  onShowAll,
}: EmptyTaskStateProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const copy = getEmptyCopy(activeFilter);

  const floatY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
      if (enabled) return;

      floatY.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    });
  }, [floatY, glowOpacity]);

  const animatedOrbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: floatY.value }],
      shadowOpacity: glowOpacity.value,
      shadowRadius: 10,
      shadowColor: colors.tint,
    };
  });

  return (
    <View style={styles.emptyContainer}>
      <GlassCard style={styles.emptyCard} contentStyle={styles.emptyCardContent}>
        <Animated.View
          style={[
            styles.iconOrb,
            {
              backgroundColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0,0,0,0.02)",
              borderColor: colors.tint,
              borderWidth: 1.5,
            },
            animatedOrbStyle,
          ]}
        >
          <MaterialIcons name={copy.icon} size={22} color={colors.tint} />
        </Animated.View>
        <ThemedText style={styles.emptyTitle}>{copy.title}</ThemedText>
        <Text style={[styles.emptyText, { color: colors.icon }]}>
          {copy.description}
        </Text>
        {activeFilter !== "all" && onShowAll && (
          <TouchableOpacity
            activeOpacity={0.72}
            accessibilityLabel="查看全部任务"
            onPress={onShowAll}
            style={[
              styles.showAllButton,
              {
                backgroundColor: Glass.inputBackground[colorScheme],
                borderColor: Glass.border[colorScheme],
              },
            ]}
          >
            <Text style={[styles.showAllText, { color: colors.tint }]}>
              查看全部
            </Text>
          </TouchableOpacity>
        )}
      </GlassCard>
    </View>
  );
}

function getEmptyCopy(activeFilter: TaskGroupFilter) {
  switch (activeFilter) {
    case "inbox":
      return {
        description: "没有无日期任务。新的碎片内容会先在这里沉淀。",
        icon: "inbox" as const,
        title: "收件箱已清空",
      };
    case "overdue":
      return {
        description: "没有逾期项，当前节奏很干净。",
        icon: "check-circle-outline" as const,
        title: "没有逾期任务",
      };
    case "today":
      return {
        description: "今天没有截止任务，可以从收件箱挑一件推进。",
        icon: "today" as const,
        title: "今天暂时空闲",
      };
    case "planned":
      return {
        description: "未来计划为空。带时间的任务会自动进入这里。",
        icon: "event-note" as const,
        title: "暂无计划任务",
      };
    case "completed":
      return {
        description: "完成任务后，它们会出现在这里供你回看。",
        icon: "done-all" as const,
        title: "还没有完成记录",
      };
    case "needsReview":
      return {
        description: "模糊时间都会集中到这里。现在没有需要确认的任务。",
        icon: "help-outline" as const,
        title: "时间都很确定",
      };
    case "all":
    default:
      return {
        description: "试着在下方输入一段乱七八糟的想法\n或者扔一张截图给 AI 整理吧！",
        icon: "auto-awesome" as const,
        title: "向 AI 投喂灵感",
      };
  }
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  emptyCard: {
    borderRadius: Radius.card,
    maxWidth: 360,
    width: "100%",
  },
  emptyCardContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: Spacing.xs,
    opacity: Opacity.subtle,
    textAlign: "center",
  },
  iconOrb: {
    alignItems: "center",
    borderRadius: Radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  showAllButton: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.md,
    minHeight: 34,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
  },
  showAllText: {
    fontSize: 13,
    fontWeight: "900",
  },
});
