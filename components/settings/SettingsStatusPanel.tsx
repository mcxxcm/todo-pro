import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { BackendHealth } from "@/lib/backendHealth";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

const STATUS_ITEMS: {
  icon: IconName;
  label: string;
  value: string;
}[] = [
  {
    icon: "storage",
    label: "任务存储",
    value: "本地",
  },
  {
    icon: "fact-check",
    label: "AI 输出",
    value: "审核后保存",
  },
  {
    icon: "article",
    label: "来源追踪",
    value: "sourceId + 原文",
  },
  {
    icon: "ios-share",
    label: "输入入口",
    value: "手动 / 分享 / OCR",
  },
];

export function SettingsStatusPanel({
  activeExtractor,
  backendHealth,
}: {
  activeExtractor: string;
  backendHealth: BackendHealth | null;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <GlassCard style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleGroup}>
          <MaterialIcons name="hub" size={17} color={colors.tint} />
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            运行状态
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: Glass.inputBackground[colorScheme],
              borderColor: Glass.border[colorScheme],
            },
          ]}
        >
          <Text style={[styles.pillText, { color: colors.tint }]}>
            {backendHealth?.provider ?? activeExtractor}
          </Text>
        </View>
      </View>

      <View style={styles.statusGrid}>
        {STATUS_ITEMS.map((item) => (
          <View
            key={item.label}
            style={[
              styles.statusCell,
              {
                backgroundColor: Glass.inputBackground[colorScheme],
                borderColor: Glass.border[colorScheme],
              },
            ]}
          >
            <MaterialIcons name={item.icon} size={16} color={colors.icon} />
            <View style={styles.statusTextGroup}>
              <Text style={[styles.rowLabel, { color: colors.icon }]}>
                {item.label}
              </Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.backendStatusRow}>
        <Text style={[styles.backendStatusText, { color: colors.icon }]}>
          后端 AI: {backendHealth?.provider ?? "未连接"} · OCR:{" "}
          {backendHealth?.ocrProvider ?? "未连接"}
        </Text>
        <Text style={[styles.backendStatusText, { color: colors.icon }]}>
          文本上限: {backendHealth?.limits.text ?? "-"} · 图片上限:{" "}
          {backendHealth?.limits.imageBase64 ?? "-"}
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  backendStatusRow: {
    gap: 2,
    marginTop: Spacing.sm,
  },
  backendStatusText: {
    fontSize: 12,
    fontWeight: "700",
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
  pill: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "900",
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: "800",
    opacity: Opacity.subtle,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  statusCell: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: "48%",
    flexDirection: "row",
    flexGrow: 1,
    gap: Spacing.xs,
    minHeight: 54,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  statusTextGroup: {
    flex: 1,
    minWidth: 0,
  },
});
