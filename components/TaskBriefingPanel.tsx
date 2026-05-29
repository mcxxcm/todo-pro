import { StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Opacity, Spacing } from "@/constants/tokens";
import type { TaskBriefing } from "@/domain/taskBriefing";
import type { NormalizedTask } from "@/types/task";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TaskBriefingPanelProps {
  briefing: TaskBriefing;
  onMergeDuplicates?: () => void | Promise<unknown>;
  tasks: NormalizedTask[];
}

export function TaskBriefingPanel({
  briefing,
  onMergeDuplicates,
  tasks,
}: TaskBriefingPanelProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const focusTasks = briefing.focusTaskIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter(Boolean) as NormalizedTask[];

  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: colors.icon }]}>
            今日简报
          </Text>
          <Text style={[styles.narrative, { color: colors.text }]}>
            {briefing.narrative}
          </Text>
        </View>
        <View style={styles.scoreBlock}>
          <Text style={[styles.score, { color: colors.text }]}>
            {briefing.focusTaskIds.length}
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.icon }]}>
            焦点
          </Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <Metric label="逾期" value={briefing.metrics.overdue} color={colors.text} muted={colors.icon} />
        <Metric label="待确认" value={briefing.metrics.needsTimeReview} color={colors.text} muted={colors.icon} />
        <Metric label="来源" value={briefing.metrics.sourceBacked} color={colors.text} muted={colors.icon} />
        <Metric label="重复" value={briefing.metrics.duplicateRisk} color={colors.text} muted={colors.icon} />
      </View>

      {briefing.recommendedActions.length > 0 && (
        <View style={styles.actionRow}>
          {briefing.recommendedActions.map((action) => (
            <View key={action} style={styles.actionPill}>
              <Text style={[styles.actionText, { color: colors.text }]}>
                {action}
              </Text>
            </View>
          ))}
          {briefing.metrics.duplicateRisk > 0 && onMergeDuplicates && (
            <Text
              accessibilityRole="button"
              onPress={() => void onMergeDuplicates()}
              style={[styles.mergeAction, { color: colors.tint }]}
            >
              一键合并
            </Text>
          )}
        </View>
      )}

      {focusTasks.length > 0 && (
        <View style={styles.focusList}>
          {focusTasks.map((task) => (
            <View key={task.id} style={styles.focusItem}>
              <Text
                numberOfLines={1}
                style={[styles.focusTitle, { color: colors.text }]}
              >
                {task.title}
              </Text>
              <Text style={[styles.focusMeta, { color: colors.icon }]}>
                {getFocusMeta(task)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

function Metric({
  color,
  label,
  muted,
  value,
}: {
  color: string;
  label: string;
  muted: string;
  value: number;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

function getFocusMeta(task: NormalizedTask) {
  if (task.timeStatus === "needs_review" || task.needsConfirmation) {
    return "时间待确认";
  }
  if (task.priority === "high") return "高优先级";
  if (task.dueText) return task.dueText;
  if (task.sourceId || task.sourceText) return "有来源证据";
  return "收件箱";
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: Spacing.sm,
  },
  content: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  narrative: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 4,
  },
  scoreBlock: {
    alignItems: "center",
    minWidth: 42,
  },
  score: {
    fontSize: 26,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    lineHeight: 30,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
  metricRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metric: {
    borderColor: "rgba(127, 127, 127, 0.18)",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 52,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
  },
  metricValue: {
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  actionPill: {
    backgroundColor: "rgba(127, 127, 127, 0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "800",
  },
  mergeAction: {
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  focusList: {
    gap: 6,
  },
  focusItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  focusTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 0,
  },
  focusMeta: {
    fontSize: 11,
    fontWeight: "700",
    opacity: Opacity.muted,
  },
});
