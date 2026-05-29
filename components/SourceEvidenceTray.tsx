import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Opacity, Radius, Spacing } from "@/constants/tokens";
import { getSourceTypeLabel } from "@/domain/sourceTimeline";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { TaskDraft } from "@/types/draft";
import { NormalizedTask } from "@/types/task";

interface SourceEvidenceTrayProps {
  tasks: NormalizedTask[];
  candidates: TaskDraft[];
}

export function SourceEvidenceTray({
  tasks,
  candidates,
}: SourceEvidenceTrayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const items = [
    ...candidates.map((candidate) => ({
      id: `draft-${candidate.id}`,
      label: "草稿来源",
      title: candidate.title,
      text: candidate.sourceText,
      status: getDraftStatusLabel(candidate),
    })),
    ...tasks
      .filter((task) => task.sourceText)
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 2)
      .map((task) => ({
        id: task.id,
        label: getSourceLabel(task.sourceType, !!task.sourceId),
        title: task.title,
        text: task.sourceText ?? "",
        status: task.sourceId ? "sourceId 已保存" : "仅文本",
      })),
  ].slice(0, 3);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.tray}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>来源证据</ThemedText>
        <Text style={[styles.count, { color: colors.icon }]}>
          {items.length}
        </Text>
      </View>

      <View style={styles.items}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.72}
            accessibilityLabel={`查看来源证据：${item.title}`}
            onPress={() =>
              setExpandedId((current) => current === item.id ? null : item.id)
            }
            style={styles.itemTouch}
          >
            <GlassCard style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemLabel}>
                  <MaterialIcons
                    name="article"
                    size={14}
                    color={colors.icon}
                  />
                  <ThemedText style={styles.labelText}>{item.label}</ThemedText>
                </View>
                <Text style={[styles.statusText, { color: colors.icon }]}>
                  {item.status}
                </Text>
              </View>
              <ThemedText style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </ThemedText>
              <ThemedText
                style={styles.itemText}
                numberOfLines={expandedId === item.id ? undefined : 2}
              >
                {item.text}
              </ThemedText>
              <View style={styles.expandRow}>
                <Text style={[styles.expandText, { color: colors.tint }]}>
                  {expandedId === item.id ? "收起原文" : "查看原文"}
                </Text>
                <MaterialIcons
                  name={expandedId === item.id ? "expand-less" : "expand-more"}
                  size={15}
                  color={colors.tint}
                />
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function getDraftStatusLabel(candidate: TaskDraft) {
  if (candidate.status === "edited") return "已编辑草稿";
  if (candidate.timeStatus === "needs_review") return "时间待确认";
  return "待确认";
}

function getSourceLabel(
  sourceType: NormalizedTask["sourceType"],
  hasSourceId: boolean,
) {
  if (sourceType) return getSourceTypeLabel(sourceType);
  return hasSourceId ? "已归档来源" : "来源文本";
}

const styles = StyleSheet.create({
  tray: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    opacity: Opacity.subtle,
  },
  count: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  items: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  itemCard: {
    borderRadius: Radius.card,
    flex: 1,
  },
  itemTouch: {
    flexBasis: 180,
    flexGrow: 1,
  },
  itemHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.xs,
  },
  itemLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xxs,
  },
  labelText: {
    fontSize: 11,
    fontWeight: "800",
    opacity: Opacity.muted,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: Spacing.xs,
  },
  itemText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    opacity: Opacity.muted,
  },
  expandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    marginTop: Spacing.xs,
  },
  expandText: {
    fontSize: 11,
    fontWeight: "900",
  },
});
