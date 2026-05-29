import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { DataCell } from "@/components/settings/MetricCell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { LocalDataSummary } from "@/providers/localDataProvider";

const SOURCE_TYPE_LABELS = [
  { label: "手动", type: "manual" },
  { label: "文本", type: "text" },
  { label: "分享", type: "share" },
  { label: "链接", type: "link" },
  { label: "PDF", type: "pdf" },
  { label: "邮件", type: "email" },
  { label: "OCR", type: "image" },
] as const;

export function LocalDataPanel({
  clearArmed,
  exportSnapshot,
  onClearLocalData,
  onCreateExportSnapshot,
  onOpenSourceLibrary,
  onRefresh,
  summary,
}: {
  clearArmed: boolean;
  exportSnapshot: {
    exportedAt: string;
    size: number;
  } | null;
  onClearLocalData: () => void;
  onCreateExportSnapshot: () => void;
  onOpenSourceLibrary: () => void;
  onRefresh: () => void;
  summary: LocalDataSummary;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <GlassCard style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleGroup}>
          <MaterialIcons name="storage" size={17} color={colors.tint} />
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            本地数据
          </Text>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          accessibilityLabel="刷新本地数据统计"
          activeOpacity={0.7}
          style={[
            styles.iconButton,
            {
              borderColor: Glass.border[colorScheme],
            },
          ]}
        >
          <MaterialIcons name="refresh" size={15} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.dataGrid}>
        <DataCell label="任务" value={summary.tasks} />
        <DataCell label="草稿" value={summary.drafts} />
        <DataCell label="来源" value={summary.sources} />
        <DataCell label="同步" value={summary.syncRecords} />
      </View>

      <View style={styles.sourceTypeGrid}>
        {SOURCE_TYPE_LABELS.map((item) => (
          <View
            key={item.type}
            style={[
              styles.sourceTypeChip,
              {
                backgroundColor: Glass.inputBackground[colorScheme],
                borderColor: Glass.border[colorScheme],
              },
            ]}
          >
            <Text style={[styles.sourceTypeLabel, { color: colors.icon }]}>
              {item.label}
            </Text>
            <Text style={[styles.sourceTypeValue, { color: colors.text }]}>
              {summary.sourceTypes[item.type] ?? 0}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onOpenSourceLibrary}
        accessibilityLabel="打开来源库"
        activeOpacity={0.7}
        style={[
          styles.sourceLibraryButton,
          {
            backgroundColor: Glass.inputBackground[colorScheme],
            borderColor: Glass.border[colorScheme],
          },
        ]}
      >
        <MaterialIcons name="article" size={16} color={colors.tint} />
        <Text style={[styles.sourceLibraryText, { color: colors.tint }]}>
          查看来源库
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onClearLocalData}
        accessibilityLabel="清空本地任务草稿和来源"
        activeOpacity={0.7}
        style={[
          styles.clearButton,
          {
            backgroundColor: clearArmed
              ? "rgba(255, 59, 48, 0.10)"
              : Glass.inputBackground[colorScheme],
            borderColor: clearArmed
              ? "rgba(255, 59, 48, 0.44)"
              : Glass.border[colorScheme],
          },
        ]}
      >
        <MaterialIcons
          name={clearArmed ? "warning" : "delete-outline"}
          size={16}
          color={clearArmed ? "#ff3b30" : colors.icon}
        />
        <Text
          style={[
            styles.clearButtonText,
            { color: clearArmed ? "#ff3b30" : colors.icon },
          ]}
        >
          {clearArmed ? "再次点击确认清空" : "清空本地数据"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCreateExportSnapshot}
        accessibilityLabel="生成本地数据导出快照"
        activeOpacity={0.7}
        style={[
          styles.exportButton,
          {
            backgroundColor: Glass.inputBackground[colorScheme],
            borderColor: Glass.border[colorScheme],
          },
        ]}
      >
        <MaterialIcons name="ios-share" size={16} color={colors.tint} />
        <Text style={[styles.exportButtonText, { color: colors.tint }]}>
          生成导出快照
        </Text>
      </TouchableOpacity>
      {exportSnapshot && (
        <Text style={[styles.exportMeta, { color: colors.icon }]}>
          {new Date(exportSnapshot.exportedAt).toLocaleString()} ·{" "}
          {exportSnapshot.size} bytes
        </Text>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.xs,
    justifyContent: "center",
    marginTop: Spacing.sm,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },
  dataGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  exportButton: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.xs,
    justifyContent: "center",
    marginTop: Spacing.xs,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: "900",
  },
  exportMeta: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  iconButton: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 30,
    justifyContent: "center",
    width: 30,
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
  sourceLibraryButton: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.xs,
    justifyContent: "center",
    marginTop: Spacing.sm,
    minHeight: 40,
    paddingHorizontal: Spacing.md,
  },
  sourceLibraryText: {
    fontSize: 13,
    fontWeight: "900",
  },
  sourceTypeChip: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.xxs,
    minHeight: 28,
    paddingHorizontal: Spacing.sm,
  },
  sourceTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  sourceTypeLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
  sourceTypeValue: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
});
