import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { DataCell } from "@/components/settings/MetricCell";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { LocalDataSummary } from "@/providers/localDataProvider";

export function InboxQualityPanel({
  quality,
}: {
  quality: LocalDataSummary["quality"];
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <GlassCard style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleGroup}>
          <MaterialIcons name="verified-user" size={17} color={colors.tint} />
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            收件箱质量
          </Text>
        </View>
        <Text style={[styles.qualityScore, { color: colors.tint }]}>
          {quality.trustScore}
        </Text>
      </View>
      <View
        style={[
          styles.qualityBarTrack,
          { backgroundColor: Glass.inputBackground[colorScheme] },
        ]}
      >
        <View
          style={[
            styles.qualityBarFill,
            {
              backgroundColor: colors.tint,
              width: `${quality.trustScore}%`,
            },
          ]}
        />
      </View>
      <View style={styles.dataGrid}>
        <DataCell
          label="来源覆盖"
          value={Math.round(quality.sourceCoverageRate * 100)}
          suffix="%"
        />
        <DataCell label="待确认" value={quality.timeReviewTasks} />
        <DataCell label="重复组" value={quality.duplicateGroups} />
        <DataCell label="孤立来源" value={quality.orphanSources} />
      </View>
      <View style={styles.qualityActionRow}>
        {quality.recommendedActions.map((action) => (
          <View
            key={action}
            style={[
              styles.qualityActionChip,
              {
                backgroundColor: Glass.inputBackground[colorScheme],
                borderColor: Glass.border[colorScheme],
              },
            ]}
          >
            <Text style={[styles.qualityActionText, { color: colors.text }]}>
              {action}
            </Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  dataGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  panel: {
    borderRadius: Radius.card,
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  panelTitleGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  qualityActionChip: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 28,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  qualityActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  qualityActionText: {
    fontSize: 12,
    fontWeight: "900",
  },
  qualityBarFill: {
    borderRadius: Radius.pill,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
  },
  qualityBarTrack: {
    borderRadius: Radius.pill,
    height: 8,
    marginTop: Spacing.sm,
    overflow: "hidden",
  },
  qualityScore: {
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
});
