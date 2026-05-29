import { StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function InboxHeader({
  draftCount,
  openTaskCount,
  sourceBackedCount,
  taskCount,
  wideLayout,
}: {
  draftCount: number;
  openTaskCount: number;
  sourceBackedCount: number;
  taskCount: number;
  wideLayout: boolean;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.header}>
      <View style={styles.headerCopy}>
        <ThemedText type="title" style={styles.headerTitle}>
          {wideLayout ? "收件箱" : "Todo Pro"}
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          {wideLayout
            ? "从来源证据到可执行任务"
            : "多形式内容的 AI 任务收件箱"}
        </ThemedText>
        <View style={styles.signalRail}>
          <SignalPill label="本地" value={taskCount} />
          <SignalPill label="草稿" value={draftCount} />
          <SignalPill label="来源" value={sourceBackedCount} />
        </View>
      </View>
      <GlassCard style={styles.statusGlassCard} contentStyle={styles.statusGlassContent}>
        <Text style={[styles.statusLabel, { color: colors.icon }]}>
          待处理
        </Text>
        <Text style={[styles.statusNumber, { color: colors.text }]}>
          {openTaskCount}
        </Text>
      </GlassCard>
    </ThemedView>
  );
}

function SignalPill({ label, value }: { label: string; value: number }) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <GlassCard style={styles.signalGlassCard} contentStyle={styles.signalGlassContent}>
      <Text style={[styles.signalLabel, { color: colors.icon }]}>
        {label}
      </Text>
      <Text style={[styles.signalValue, { color: colors.text }]}>
        {value}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    backgroundColor: "transparent",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    paddingBottom: 4,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  signalGlassCard: {
    borderRadius: 8,
  },
  signalGlassContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  signalLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  signalRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  signalValue: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  statusGlassCard: {
    borderRadius: 8,
    minWidth: 78,
  },
  statusGlassContent: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 1,
  },
  statusNumber: {
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
});
