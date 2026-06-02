import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { computeProductivityStats } from "@/domain/productivityStats";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { FocusSession, NormalizedTask } from "@/types/task";

interface StatsPanelProps {
  tasks: NormalizedTask[];
}

const TREND_OPTIONS = [
  { days: 7, label: "7天" },
  { days: 30, label: "30天" },
  { days: 90, label: "全部" },
] as const;

export function StatsPanel({ tasks }: StatsPanelProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const [trendDays, setTrendDays] = useState(7);

  const stats = useMemo(() => computeProductivityStats(tasks, new Date(), trendDays), [tasks, trendDays]);

  if (stats.totalDone + stats.totalOpen === 0) return null;

  const pct = Math.round(stats.completionRate * 100);
  const maxTrend = Math.max(1, ...stats.dailyTrend.map((p) => Math.max(p.completed, p.created)));

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="bar-chart" size={16} color={colors.tint} />
        <Text style={[styles.title, { color: colors.text }]}>生产力统计</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.tint }]}>{pct}%</Text>
          <Text style={[styles.metricLabel, { color: colors.icon }]}>完成率</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.tint }]}>{stats.streakDays}</Text>
          <Text style={[styles.metricLabel, { color: colors.icon }]}>连续天数</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.tint }]}>{stats.totalDone}</Text>
          <Text style={[styles.metricLabel, { color: colors.icon }]}>已完成</Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: colors.tint }]}>
            {stats.avgCompletionHours !== null ? `${stats.avgCompletionHours.toFixed(1)}h` : "-"}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.icon }]}>平均耗时</Text>
        </View>
      </View>

      {(stats.totalEstimatedMinutes > 0 || stats.totalActualMinutes > 0) && (
        <View style={styles.infoRow}>
          <MaterialIcons name="speed" size={12} color={colors.icon} />
          <Text style={[styles.infoText, { color: colors.icon }]}>
            预估 {formatMinutes(stats.totalEstimatedMinutes)} · 实际 {formatMinutes(stats.totalActualMinutes)}
            {stats.totalEstimatedMinutes > 0 && stats.totalActualMinutes > 0 && (
              <> · 偏差 {stats.totalActualMinutes > stats.totalEstimatedMinutes ? "+" : ""}{stats.totalActualMinutes - stats.totalEstimatedMinutes}分钟</>
            )}
          </Text>
        </View>
      )}

      {(() => {
        const allSessions = tasks.reduce<FocusSession[]>((acc, t) => acc.concat(t.focusSessions ?? []), []);
        const sessionCount = allSessions.length;
        const totalFocusMin = allSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
        if (sessionCount === 0) return null;
        return (
          <View style={styles.infoRow}>
            <MaterialIcons name="timer" size={12} color={colors.icon} />
            <Text style={[styles.infoText, { color: colors.icon }]}>
              专注 {sessionCount} 次 · 共 {formatMinutes(totalFocusMin)}
            </Text>
          </View>
        );
      })()}

      {stats.mostProductiveDay && (
        <View style={styles.infoRow}>
          <MaterialIcons name="emoji-events" size={12} color={colors.icon} />
          <Text style={[styles.infoText, { color: colors.icon }]}>
            最高产日：{stats.mostProductiveDay}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>趋势</Text>
          <View style={styles.trendToggleRow}>
            {TREND_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.days}
                onPress={() => setTrendDays(opt.days)}
                style={[
                  styles.trendToggle,
                  {
                    backgroundColor: trendDays === opt.days ? colors.tint : Glass.inputBackground[colorScheme],
                    borderColor: trendDays === opt.days ? colors.tint : Glass.border[colorScheme],
                  },
                ]}
              >
                <Text style={[
                  styles.trendToggleText,
                  { color: trendDays === opt.days ? (colorScheme === "dark" ? "#11181C" : "#fff") : colors.icon },
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.chartRow}>
          {stats.dailyTrend.map((point, i) => {
            const dateLabel = point.date.slice(5);
            return (
              <View key={i} style={styles.barCol}>
                <View style={styles.barStack}>
                  <View
                    style={[
                      styles.barDone,
                      {
                        height: Math.max(2, (point.completed / maxTrend) * 40),
                        backgroundColor: colors.tint,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.barCreated,
                      {
                        height: Math.max(2, (point.created / maxTrend) * 40),
                        backgroundColor: colors.icon,
                        opacity: 0.3,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.icon }]}>{dateLabel}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
            <Text style={[styles.legendText, { color: colors.icon }]}>完成</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.icon, opacity: 0.3 }]} />
            <Text style={[styles.legendText, { color: colors.icon }]}>新建</Text>
          </View>
        </View>
      </View>

      {stats.sourceDistribution.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>来源分布</Text>
          {stats.sourceDistribution.slice(0, 6).map((dist, i) => {
            const barWidth = Math.max(2, (dist.count / Math.max(...stats.sourceDistribution.map((d) => d.count))) * 100);
            return (
              <View key={i} style={styles.sourceRow}>
                <Text style={[styles.sourceLabel, { color: colors.text }]}>
                  {sourceTypeLabel(dist.sourceType)}
                </Text>
                <View style={[styles.sourceBarBg, { backgroundColor: Glass.surface.ambientShade[colorScheme] }]}>
                  <View style={[styles.sourceBar, { width: `${barWidth}%`, backgroundColor: colors.tint }]} />
                </View>
                <Text style={[styles.sourceCount, { color: colors.icon }]}>{dist.count}</Text>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "-";
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}m` : `${h}h`;
}

function sourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: "文本",
    image: "图片",
    share: "分享",
    manual: "手动",
    unknown: "未知",
  };
  return labels[type] ?? type;
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
    fontSize: 15,
    fontWeight: "900",
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontWeight: "600",
  },
  section: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 60,
    paddingTop: 8,
  },
  barCol: {
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  barStack: {
    flexDirection: "column-reverse",
    alignItems: "center",
    width: 12,
    gap: 1,
  },
  barDone: {
    width: "100%",
    borderRadius: 2,
    minHeight: 2,
  },
  barCreated: {
    width: "100%",
    borderRadius: 2,
    minHeight: 2,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: "700",
  },
  legend: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  legendDot: {
    width: 8,
    height: 8,
  },
  legendText: {
    fontSize: 10,
    fontWeight: "600",
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: "700",
    width: 36,
  },
  sourceBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  sourceBar: {
    height: "100%",
    borderRadius: 4,
  },
  sourceCount: {
    fontSize: 10,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    width: 24,
    textAlign: "right",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendToggleRow: {
    flexDirection: "row",
    gap: 4,
  },
  trendToggle: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendToggleText: {
    fontSize: 10,
    fontWeight: "800",
  },
});
