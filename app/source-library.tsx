import { useCallback, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import {
  buildSourceTimeline,
  getSourceTypeLabel,
  type SourceTimelineItem,
} from "@/domain/sourceTimeline";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { activeExtractor } from "@/extractors";
import { loadTaskDrafts } from "@/lib/draftStorage";
import { loadSources } from "@/lib/sourceStorage";
import { loadTasks } from "@/lib/taskStorage";
import { createLocalDrafts } from "@/providers/localDraftProvider";
import { deleteOrphanLocalSources } from "@/providers/localSourceProvider";
import type { SourceItemType } from "@/types/source";

const SOURCE_ICONS: Record<SourceItemType, keyof typeof MaterialIcons.glyphMap> = {
  email: "mail-outline",
  image: "image",
  link: "link",
  manual: "edit-note",
  pdf: "picture-as-pdf",
  share: "ios-share",
  text: "article",
};

type SourceLibraryFilter = "all" | "orphan" | SourceItemType;

const SOURCE_FILTERS: {
  id: SourceLibraryFilter;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { id: "all", icon: "dashboard", label: "全部" },
  { id: "orphan", icon: "auto-delete", label: "孤立" },
  { id: "manual", icon: "edit-note", label: "手动" },
  { id: "share", icon: "ios-share", label: "分享" },
  { id: "image", icon: "image", label: "OCR" },
  { id: "link", icon: "link", label: "链接" },
  { id: "pdf", icon: "picture-as-pdf", label: "PDF" },
  { id: "email", icon: "mail-outline", label: "邮件" },
  { id: "text", icon: "article", label: "文本" },
];

export default function SourceLibraryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const { activeTheme } = useAppTheme();
  const [items, setItems] = useState<SourceTimelineItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [extractingSourceId, setExtractingSourceId] = useState<string | null>(null);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<SourceLibraryFilter>("all");

  const loadTimeline = useCallback(async () => {
    const [drafts, sources, tasks] = await Promise.all([
      loadTaskDrafts(),
      loadSources(),
      loadTasks(),
    ]);
    setItems(buildSourceTimeline({ drafts, sources, tasks }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTimeline();
    }, [loadTimeline]),
  );

  const sourceBackedCount = items.filter(
    (item) => item.taskCount > 0 || item.draftCount > 0,
  ).length;
  const orphanCount = items.filter((item) => item.isOrphan).length;
  const visibleItems = items.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "orphan") return item.isOrphan;
    return item.type === activeFilter;
  });

  const handleExtractAgain = async (item: SourceTimelineItem) => {
    if (!item.preview.trim() || extractingSourceId) return;

    setExtractingSourceId(item.id);
    try {
      const result = await activeExtractor.extract(item.preview);
      await createLocalDrafts(
        result.tasks.map((task) => ({
          ...task,
          sourceId: item.id,
          sourceType: item.type,
        })),
      );
      router.push("/");
    } finally {
      setExtractingSourceId(null);
    }
  };

  const handleCleanOrphans = async () => {
    if (orphanCount === 0 || cleaningOrphans) return;

    setCleaningOrphans(true);
    try {
      const deleted = await deleteOrphanLocalSources();
      setCleanupMessage(`已清理 ${deleted} 条孤立来源`);
      await loadTimeline();
    } finally {
      setCleaningOrphans(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: activeTheme.colors[colorScheme].base },
      ]}
    >
      <View
        style={[
          styles.liquidSurface,
          { backgroundColor: activeTheme.colors[colorScheme].base },
        ]}
      >
        <View
          style={[
            styles.liquidBlob,
            styles.blobOne,
            { backgroundColor: activeTheme.colors[colorScheme].blob1 },
          ]}
          {...(Platform.OS === "web" ? { dataSet: { cssClass: "liquid-blob-1" } } : {})}
        />
        <View
          style={[
            styles.liquidBlob,
            styles.blobTwo,
            { backgroundColor: activeTheme.colors[colorScheme].blob2 },
          ]}
          {...(Platform.OS === "web" ? { dataSet: { cssClass: "liquid-blob-2" } } : {})}
        />
        <LinearGradient
          colors={[
            Glass.surface.naturalLight[colorScheme],
            Glass.surface.naturalFalloff[colorScheme],
            "rgba(255, 255, 255, 0)",
          ]}
          locations={[0, 0.5, 1]}
          style={styles.naturalLight}
        />
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.72}
          accessibilityLabel="关闭来源库"
          onPress={() => router.back()}
          style={[
            styles.iconButton,
            {
              backgroundColor: Glass.inputBackground[colorScheme],
              borderColor: Glass.border[colorScheme],
            },
          ]}
        >
          <MaterialIcons name="close" size={20} color={colors.icon} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>来源库</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            所有输入来源、任务关联和草稿记录
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <Metric label="来源" value={items.length} />
            <Metric label="已关联" value={sourceBackedCount} />
            <Metric
              label="孤立"
              value={orphanCount}
            />
          </View>
          <TouchableOpacity
            activeOpacity={orphanCount > 0 ? 0.72 : 1}
            accessibilityLabel="清理孤立来源"
            disabled={orphanCount === 0 || cleaningOrphans}
            onPress={() => void handleCleanOrphans()}
            style={[
              styles.cleanButton,
              {
                backgroundColor: Glass.inputBackground[colorScheme],
                borderColor: Glass.border[colorScheme],
                opacity: orphanCount === 0 ? Opacity.disabled : 1,
              },
            ]}
          >
            <MaterialIcons name="auto-delete" size={15} color={colors.tint} />
            <Text style={[styles.cleanButtonText, { color: colors.tint }]}>
              {cleaningOrphans ? "清理中..." : "清理孤立来源"}
            </Text>
          </TouchableOpacity>
          {cleanupMessage && (
            <Text style={[styles.cleanupMessage, { color: colors.icon }]}>
              {cleanupMessage}
            </Text>
          )}
        </GlassCard>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {SOURCE_FILTERS.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                activeOpacity={0.72}
                accessibilityLabel={`筛选${filter.label}来源`}
                accessibilityState={{ selected: active }}
                onPress={() => setActiveFilter(filter.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active
                      ? colorScheme === "dark"
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(255, 255, 255, 0.72)"
                      : Glass.inputBackground[colorScheme],
                    borderColor: active ? Glass.rim[colorScheme] : Glass.border[colorScheme],
                  },
                ]}
              >
                <MaterialIcons
                  name={filter.icon}
                  size={14}
                  color={active ? colors.text : colors.icon}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? colors.text : colors.icon },
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {visibleItems.length === 0 ? (
          <GlassCard style={styles.emptyCard} contentStyle={styles.emptyContent}>
            <MaterialIcons name="article" size={28} color={colors.icon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {items.length === 0 ? "还没有来源" : "当前筛选为空"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              {items.length === 0
                ? "从首页输入、分享或上传图片后，来源会自动归档在这里。"
                : "换一个来源类型，或者回到全部来源。"}
            </Text>
            {items.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.72}
                accessibilityLabel="查看全部来源"
                onPress={() => setActiveFilter("all")}
                style={[
                  styles.showAllButton,
                  {
                    backgroundColor: Glass.inputBackground[colorScheme],
                    borderColor: Glass.border[colorScheme],
                  },
                ]}
              >
                <Text style={[styles.showAllText, { color: colors.tint }]}>
                  查看全部
                </Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        ) : (
          <View style={styles.timeline}>
            {visibleItems.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.76}
                  accessibilityLabel={`查看来源：${item.title}`}
                  onPress={() => setExpandedId(expanded ? null : item.id)}
                >
                  <GlassCard style={styles.sourceCard}>
                    <View style={styles.sourceHeader}>
                      <View
                        style={[
                          styles.sourceIcon,
                          {
                            backgroundColor: Glass.inputBackground[colorScheme],
                            borderColor: Glass.border[colorScheme],
                          },
                        ]}
                      >
                        <MaterialIcons
                          name={SOURCE_ICONS[item.type]}
                          size={17}
                          color={colors.icon}
                        />
                      </View>
                      <View style={styles.sourceCopy}>
                        <Text
                          numberOfLines={1}
                          style={[styles.sourceTitle, { color: colors.text }]}
                        >
                          {item.title}
                        </Text>
                        <Text style={[styles.sourceMeta, { color: colors.icon }]}>
                          {getSourceTypeLabel(item.type)} ·{" "}
                          {new Date(item.createdAt).toLocaleString()}
                        </Text>
                      </View>
                      <MaterialIcons
                        name={expanded ? "expand-less" : "expand-more"}
                        size={18}
                        color={colors.icon}
                      />
                    </View>
                    <View style={styles.badgeRow}>
                      <Badge label="任务" value={item.taskCount} />
                      <Badge label="草稿" value={item.draftCount} />
                      {item.url && <Badge label="链接" value="有" />}
                      {item.isOrphan && <Badge label="状态" value="孤立" />}
                    </View>
                    <Text
                      numberOfLines={expanded ? undefined : 3}
                      style={[styles.preview, { color: colors.icon }]}
                    >
                      {item.preview}
                    </Text>
                    {expanded && (
                      <TouchableOpacity
                        activeOpacity={0.72}
                        accessibilityLabel={`从${item.title}重新提取任务`}
                        disabled={extractingSourceId !== null}
                        onPress={() => void handleExtractAgain(item)}
                        style={[
                          styles.extractButton,
                          {
                            backgroundColor: Glass.inputBackground[colorScheme],
                            borderColor: Glass.border[colorScheme],
                            opacity: extractingSourceId !== null ? Opacity.disabled : 1,
                          },
                        ]}
                      >
                        <MaterialIcons
                          name="auto-awesome"
                          size={15}
                          color={colors.tint}
                        />
                        <Text style={[styles.extractButtonText, { color: colors.tint }]}>
                          {extractingSourceId === item.id ? "提取中..." : "重新提取任务"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: Glass.inputBackground[colorScheme],
          borderColor: Glass.border[colorScheme],
        },
      ]}
    >
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.icon }]}>{label}</Text>
    </View>
  );
}

function Badge({ label, value }: { label: string; value: number | string }) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: Glass.inputBackground[colorScheme],
          borderColor: Glass.border[colorScheme],
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: colors.icon }]}>
        {label} {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  liquidSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  liquidBlob: {
    borderRadius: 9999,
    position: "absolute",
    ...Platform.select({
      web: {
        filter: "blur(90px)",
      },
    }),
  },
  blobOne: {
    height: 280,
    left: -90,
    top: -90,
    transform: [{ rotate: "16deg" }],
    width: 380,
  },
  blobTwo: {
    height: 220,
    right: -110,
    top: 160,
    transform: [{ rotate: "-20deg" }],
    width: 420,
  },
  naturalLight: {
    height: 320,
    left: 0,
    opacity: 0.84,
    position: "absolute",
    right: 0,
    top: 0,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  content: {
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: 56,
  },
  summaryCard: {
    borderRadius: Radius.card,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  cleanButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    minHeight: 36,
    paddingHorizontal: Spacing.md,
  },
  cleanButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
  cleanupMessage: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  filterRow: {
    gap: Spacing.xs,
    paddingRight: Spacing.lg,
  },
  filterChip: {
    alignItems: "center",
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 5,
    minHeight: 34,
    paddingHorizontal: Spacing.sm,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "900",
  },
  metric: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 58,
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  emptyCard: {
    borderRadius: Radius.card,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: Spacing.xs,
    opacity: Opacity.subtle,
    textAlign: "center",
  },
  showAllButton: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    marginTop: Spacing.md,
    minHeight: 34,
    paddingHorizontal: Spacing.md,
  },
  showAllText: {
    fontSize: 13,
    fontWeight: "900",
  },
  timeline: {
    gap: Spacing.sm,
  },
  sourceCard: {
    borderRadius: Radius.card,
  },
  sourceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sourceIcon: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  sourceCopy: {
    flex: 1,
    minWidth: 0,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  sourceMeta: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  badge: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
  },
  preview: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: Spacing.sm,
    opacity: Opacity.subtle,
  },
  extractButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    minHeight: 34,
    paddingHorizontal: Spacing.sm,
  },
  extractButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
});
