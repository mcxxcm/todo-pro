import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import * as Sharing from "expo-sharing";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { computeWeeklyReport, type WeeklyReport } from "@/domain/weeklyReport";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { loadJsonArray, saveJsonArray } from "@/lib/jsonStorage";
import type { NormalizedTask } from "@/types/task";

interface WeeklyReportPanelProps {
  tasks: NormalizedTask[];
}

const REPORT_HISTORY_KEY = "weekly_report_history";

function generateShareText(report: WeeklyReport): string {
  return `📊 Todo Pro 周报 — ${report.weekLabel}\n` +
    `完成: ${report.completedCount} | 新建: ${report.createdCount} | 完成率: ${Math.round(report.completionRate * 100)}%\n` +
    `高优先级: ${report.highPriorityCompleted} | 逾期: ${report.overdueCount}\n` +
    `连续天数: ${report.streakDays}\n` +
    `最高产日: ${report.bestDay?.date ?? "N/A"}\n` +
    `主要来源: ${report.topSourceType ?? "无"}\n` +
    (report.avgCompletionHours ? `平均耗时: ${report.avgCompletionHours.toFixed(1)}h\n` : "") +
    `\n${report.summary}`;
}

export function WeeklyReportPanel({ tasks }: WeeklyReportPanelProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const [history, setHistory] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    loadJsonArray<WeeklyReport>(REPORT_HISTORY_KEY).then((h) => setHistory(h.slice(0, 3)));
  }, []);

  const report = useMemo(() => computeWeeklyReport(tasks), [tasks]);

  const handleShare = useCallback(async () => {
    const shareText = generateShareText(report);
    if (Platform.OS === "web") {
      try { await navigator.clipboard.writeText(shareText); } catch {}
      return;
    }
    try {
      await Sharing.shareAsync(undefined as any, { mimeType: "text/plain", dialogTitle: "分享周报" });
    } catch {
      // Sharing may not be available
      try { await navigator.clipboard?.writeText(shareText); } catch {}
    }
  }, [report]);

  useEffect(() => {
    if (report.completedCount + report.createdCount > 0) {
      saveJsonArray(REPORT_HISTORY_KEY, [report, ...history].slice(0, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.weekLabel]);

  if (report.completedCount + report.createdCount === 0) return null;

  const pct = Math.round(report.completionRate * 100);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="date-range" size={16} color={colors.tint} />
        <Text style={[styles.title, { color: colors.text }]}>本周报告</Text>
        <Text style={[styles.weekLabel, { color: colors.icon }]}>{report.weekLabel}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn} accessibilityLabel="分享周报">
          <MaterialIcons name="ios-share" size={16} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.tint }]}>{report.completedCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.icon }]}>完成</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.tint }]}>{report.createdCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.icon }]}>新建</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.tint }]}>{pct}%</Text>
          <Text style={[styles.metricLabel, { color: colors.icon }]}>完成率</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.tint }]}>{report.overdueCount}</Text>
          <Text style={[styles.metricLabel, { color: colors.icon }]}>逾期</Text>
        </View>
      </View>

      <Text style={[styles.summary, { color: colors.text }]}>{report.summary}</Text>

      {history.length > 1 && (
        <View style={styles.historySection}>
          <Text style={[styles.historyTitle, { color: colors.icon }]}>历史周报</Text>
          {history.slice(1, 4).map((h, i) => (
            <Text key={i} style={[styles.historyItem, { color: colors.icon }]}>
              {h.weekLabel}: 完成{h.completedCount} · 新建{h.createdCount} · {Math.round(h.completionRate * 100)}%
            </Text>
          ))}
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
  weekLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  summary: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    opacity: 0.85,
  },
  shareBtn: {
    padding: 4,
  },
  historySection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
    gap: 4,
  },
  historyTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  historyItem: {
    fontSize: 11,
    fontWeight: "600",
  },
});
