import { useCallback, useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SourceFilterBar, type SourceLibraryFilter } from "@/components/source/SourceFilterBar";
import { SourceListItem } from "@/components/source/SourceListItem";
import { SourceSummary } from "@/components/source/SourceSummary";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import { buildSourceTimeline, type SourceTimelineItem } from "@/domain/sourceTimeline";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { activeExtractor } from "@/extractors";
import { loadTaskDrafts } from "@/lib/draftStorage";
import { loadSources } from "@/lib/sourceStorage";
import { loadTasks } from "@/lib/taskStorage";
import { createLocalDrafts } from "@/providers/localDraftProvider";
import { deleteOrphanLocalSources } from "@/providers/localSourceProvider";

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

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "orphan") return item.isOrphan;
      return item.type === activeFilter;
    });
  }, [items, activeFilter]);

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

      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItemWrapper}>
            <SourceListItem
              item={item}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              onExtract={(it) => void handleExtractAgain(it)}
              extracting={extractingSourceId === item.id}
            />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <SourceSummary
              totalCount={items.length}
              backedCount={sourceBackedCount}
              orphanCount={orphanCount}
            />
            {orphanCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.72}
                accessibilityLabel="清理孤立来源"
                disabled={cleaningOrphans}
                onPress={() => void handleCleanOrphans()}
                style={[
                  styles.cleanButton,
                  {
                    backgroundColor: Glass.inputBackground[colorScheme],
                    borderColor: Glass.border[colorScheme],
                    opacity: cleaningOrphans ? Opacity.disabled : 1,
                  },
                ]}
              >
                <MaterialIcons name="auto-delete" size={15} color={colors.tint} />
                <Text style={[styles.cleanButtonText, { color: colors.tint }]}>
                  {cleaningOrphans ? "清理中..." : "清理孤立来源"}
                </Text>
              </TouchableOpacity>
            )}
            {cleanupMessage && (
              <Text style={[styles.cleanupMessage, { color: colors.icon }]}>
                {cleanupMessage}
              </Text>
            )}
            <SourceFilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            {visibleItems.length > 0 && (
              <Text style={[styles.resultCount, { color: colors.icon }]}>
                {visibleItems.length} 条来源
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
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
            </View>
          </GlassCard>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </SafeAreaView>
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
  listContent: {
    gap: 0,
    padding: Spacing.lg,
    paddingBottom: 56,
  },
  listHeader: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  listItemWrapper: {
    marginBottom: Spacing.sm,
  },
  cleanButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.xs,
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
    textAlign: "center",
  },
  resultCount: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
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
});
