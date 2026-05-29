import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing, StatusColors } from "@/constants/tokens";
import type { TaskGroupCounts, TaskGroupFilter } from "@/domain/taskGrouping";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TaskFilterRailProps {
  activeFilter: TaskGroupFilter;
  counts: TaskGroupCounts;
  onFilterChange: (filter: TaskGroupFilter) => void;
}

const FILTER_ITEMS = [
  { filter: "all", icon: "dashboard", label: "全部" },
  { filter: "inbox", icon: "inbox", label: "收件箱" },
  { filter: "overdue", icon: "error-outline", label: "逾期" },
  { filter: "today", icon: "today", label: "今天" },
  { filter: "planned", icon: "event-note", label: "计划" },
  { filter: "needsReview", icon: "help-outline", label: "确认" },
  { filter: "completed", icon: "done", label: "完成" },
] as const;

export function TaskFilterRail({
  activeFilter,
  counts,
  onFilterChange,
}: TaskFilterRailProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {FILTER_ITEMS.map((item) => {
          const active = activeFilter === item.filter;
          const count = counts[item.filter];
          const isOverdue = item.filter === "overdue" && count > 0;
          return (
            <TouchableOpacity
              key={item.filter}
              activeOpacity={0.72}
              accessibilityLabel={`筛选${item.label}任务`}
              accessibilityState={{ selected: active }}
              onPress={() => onFilterChange(item.filter)}
              style={[
                styles.item,
                {
                  backgroundColor: active
                    ? colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(255, 255, 255, 0.72)"
                    : Glass.inputBackground[colorScheme],
                  borderColor: active ? Glass.rim[colorScheme] : Glass.border[colorScheme],
                },
                active && { borderWidth: 1 },
              ]}
            >
              <MaterialIcons
                name={item.icon}
                size={14}
                color={active ? colors.tint : isOverdue ? StatusColors.danger : colors.icon}
              />
              <Text style={[
                styles.label,
                { color: active ? colors.tint : isOverdue ? StatusColors.danger : colors.icon },
                active && styles.labelActive,
              ]}>
                {item.label}
              </Text>
              <Text style={[
                styles.count,
                { color: active ? colors.tint : isOverdue ? StatusColors.danger : colors.icon },
                isOverdue && !active && styles.countOverdue,
              ]}>
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.sm,
  },
  content: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  item: {
    alignItems: "center",
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 5,
    minHeight: 34,
    paddingHorizontal: Spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
  labelActive: {
    fontWeight: "900",
  },
  count: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  countOverdue: {
    fontWeight: "900",
  },
});
