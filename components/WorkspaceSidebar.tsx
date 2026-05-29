import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { BlurTint, BlurView } from "expo-blur";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import {
  getTaskGroupCounts,
  type TaskGroupFilter,
} from "@/domain/taskGrouping";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { NormalizedTask } from "@/types/task";

interface WorkspaceSidebarProps {
  tasks: NormalizedTask[];
  draftCount: number;
  activeFilter: TaskGroupFilter;
  onFilterChange: (filter: TaskGroupFilter) => void;
  onReviewPress?: () => void;
}

export function WorkspaceSidebar({
  tasks,
  draftCount,
  activeFilter,
  onFilterChange,
  onReviewPress,
}: WorkspaceSidebarProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const counts = getTaskGroupCounts(tasks);

  const items = [
    { filter: "all", icon: "dashboard", label: "全部", value: counts.all },
    { filter: "inbox", icon: "inbox", label: "收件箱", value: counts.inbox },
    { filter: "overdue", icon: "error-outline", label: "已逾期", value: counts.overdue },
    { filter: "today", icon: "today", label: "今天", value: counts.today },
    { filter: "planned", icon: "event-note", label: "计划", value: counts.planned },
    { filter: "needsReview", icon: "help-outline", label: "待确认", value: counts.needsReview },
    { filter: "completed", icon: "done", label: "已完成", value: counts.completed },
  ] as const;

  const blurTint: BlurTint =
    colorScheme === "dark"
      ? "systemUltraThinMaterialDark"
      : "systemUltraThinMaterialLight";

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: Glass.background[colorScheme],
          borderColor: Glass.border[colorScheme],
        },
      ]}
    >
      <BlurView
        tint={blurTint}
        intensity={Glass.blurIntensity[colorScheme]}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFillObject}
        {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'glass-blur-sidebar' } } : {})}
      />
      <View style={styles.brandBlock}>
        <View style={[styles.brandMark, { borderColor: Glass.rim[colorScheme] }]}>
          <MaterialIcons name="task-alt" size={18} color={colors.text} />
        </View>
        <View style={styles.brandText}>
          <ThemedText style={styles.brandTitle}>Todo Pro</ThemedText>
          <ThemedText style={styles.brandSubtitle}>AI 任务收件箱</ThemedText>
        </View>
      </View>

      <View style={styles.navList}>
        {items.map((item) => {
          const active = activeFilter === item.filter;
          return (
            <TouchableOpacity
              key={item.label}
              activeOpacity={0.72}
              accessibilityLabel={`筛选${item.label}任务`}
              accessibilityState={{ selected: active }}
              onPress={() => onFilterChange(item.filter)}
              style={[
                styles.navItem,
                active && {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.07)"
                      : "rgba(255, 255, 255, 0.72)",
                },
              ]}
              {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'sidebar-item' } } : {})}
            >
              <MaterialIcons
                name={item.icon}
                size={17}
                color={active ? colors.text : colors.icon}
              />
              <ThemedText style={[styles.navLabel, !active && styles.muted]}>
                {item.label}
              </ThemedText>
              <Text style={[styles.navCount, { color: colors.icon }]}>
                {item.value}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          activeOpacity={draftCount > 0 ? 0.72 : 1}
          accessibilityLabel="打开待审核草稿"
          accessibilityState={{ disabled: draftCount === 0 }}
          disabled={draftCount === 0}
          onPress={onReviewPress}
          style={[
            styles.navItem,
            styles.reviewItem,
            {
              borderColor: Glass.border[colorScheme],
              opacity: draftCount > 0 ? 1 : Opacity.muted,
            },
          ]}
        >
          <MaterialIcons name="auto-awesome" size={17} color={colors.icon} />
          <ThemedText style={[styles.navLabel, styles.muted]}>
            待审核
          </ThemedText>
          <Text style={[styles.navCount, { color: colors.icon }]}>
            {draftCount}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.sidebarFooter, { borderTopColor: Glass.border[colorScheme] }]}>
        <ThemedText style={styles.footerLabel}>来源追踪</ThemedText>
        <ThemedText style={styles.footerText}>
          每条 AI 任务保留原始文本与 sourceId。
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.lg,
    padding: Spacing.md,
    width: 228,
    overflow: "hidden",
  },
  brandBlock: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  brandMark: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  brandSubtitle: {
    fontSize: 12,
    opacity: Opacity.muted,
  },
  navList: {
    gap: Spacing.xs,
  },
  navItem: {
    alignItems: "center",
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 38,
    paddingHorizontal: Spacing.sm,
  },
  reviewItem: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  navLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  muted: {
    opacity: Opacity.subtle,
  },
  navCount: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
  sidebarFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
    marginTop: "auto",
    paddingTop: Spacing.md,
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: "800",
    opacity: Opacity.subtle,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 17,
    opacity: Opacity.muted,
  },
});
