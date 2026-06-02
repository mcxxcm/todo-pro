import { StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { DataCell } from "@/components/settings/MetricCell";
import { Radius, Spacing, StatusColors } from "@/constants/tokens";

interface SourceSummaryProps {
  totalCount: number;
  backedCount: number;
  orphanCount: number;
  onCleanOrphans?: () => void;
  cleaning?: boolean;
  cleanupMessage?: string | null;
}

export function SourceSummary({
  totalCount,
  backedCount,
  orphanCount,
}: SourceSummaryProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.grid}>
        <DataCell label="来源" value={totalCount} />
        <DataCell label="已关联" value={backedCount} />
        <DataCell label="孤立" value={orphanCount} />
      </View>
      {orphanCount > 0 && (
        <Text style={[styles.orphanHint, { color: StatusColors.warning }]}>
          {orphanCount} 条来源没有关联任务或草稿
        </Text>
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
  grid: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  orphanHint: {
    fontSize: 11,
    fontWeight: "600",
  },
});
