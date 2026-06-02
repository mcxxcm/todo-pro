import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { computeSourceEfficiency } from "@/domain/sourceEfficiency";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing, StatusColors } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NormalizedTask } from "@/types/task";

const SOURCE_LABELS: Record<string, string> = {
  text: "文本输入",
  image: "拍照识别",
  share: "系统分享",
  manual: "手动创建",
};

function sourceLabel(type: string): string {
  return SOURCE_LABELS[type] ?? type;
}

interface SourceEfficiencyPanelProps {
  tasks: NormalizedTask[];
}

export function SourceEfficiencyPanel({ tasks }: SourceEfficiencyPanelProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const report = useMemo(() => computeSourceEfficiency(tasks), [tasks]);

  if (report.entries.length === 0) return null;

  const maxTotal = Math.max(...report.entries.map((e) => e.totalTasks));

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="insights" size={16} color={colors.tint} />
        <Text style={[styles.title, { color: colors.text }]}>来源效率</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          总完成率 {Math.round(report.overallCompletionRate * 100)}%
        </Text>
      </View>

      {report.entries.map((entry, i) => {
        const barWidth = Math.max(2, (entry.totalTasks / maxTotal) * 100);
        const donePct = Math.round(entry.completionRate * 100);
        return (
          <View key={i} style={styles.entryRow}>
            <Text style={[styles.entryLabel, { color: colors.text }]}>
              {sourceLabel(entry.sourceType)}
            </Text>
            <View style={styles.barColumn}>
              <View style={[styles.barBg, { backgroundColor: Glass.surface.ambientShade[colorScheme] }]}>
                <View style={[styles.barDone, { width: `${barWidth}%`, backgroundColor: colors.tint }]} />
              </View>
              <View style={styles.barStats}>
                <Text style={[styles.barStatText, { color: colors.icon }]}>
                  {entry.completedTasks}/{entry.totalTasks} ({donePct}%)
                </Text>
                <Text style={[styles.barStatText, { color: StatusColors.warning }]}>
                  逾期 {entry.overdueCount}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

      {report.bestSource && (
        <View style={styles.footer}>
          <MaterialIcons name="star" size={12} color={colors.tint} />
          <Text style={[styles.footerText, { color: colors.tint }]}>
            最佳渠道：{sourceLabel(report.bestSource.sourceType)} ({Math.round(report.bestSource.completionRate * 100)}% 完成率)
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  entryLabel: {
    fontSize: 11,
    fontWeight: "700",
    width: 56,
  },
  barColumn: {
    flex: 1,
    gap: 2,
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barDone: {
    height: "100%",
    borderRadius: 4,
  },
  barStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barStatText: {
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
