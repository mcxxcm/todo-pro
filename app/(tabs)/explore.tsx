import { useCallback, useEffect, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getTodoistToken, setTodoistToken, removeTodoistToken } from "@/lib/todoistStorage";
import { setThemePreset } from "@/lib/themeStorage";
import { ThemePresetId } from "@/constants/themePresets";
import { useAppTheme } from "@/hooks/use-app-theme";

import { GlassCard } from "@/components/ui/GlassCard";
import { EXTRACTOR_CONFIG } from "@/constants/extractorConfig";
import { SYNC_TARGETS } from "@/constants/syncTargets";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing, StatusColors } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { BackendHealth, fetchBackendHealth } from "@/lib/backendHealth";
import { InboxQualityPanel } from "@/components/settings/InboxQualityPanel";
import { LocalDataPanel } from "@/components/settings/LocalDataPanel";
import { SettingsStatusPanel } from "@/components/settings/SettingsStatusPanel";
import { SyncTargetsPanel } from "@/components/settings/SyncTargetsPanel";
import { ThemePickerPanel } from "@/components/settings/ThemePickerPanel";
import {
  clearAllLocalData,
  exportAllLocalData,
  getLocalDataSummary,
  LocalDataSummary,
} from "@/providers/localDataProvider";
import {
  getSyncPreflight,
  getSyncRecords,
  getSyncSummary,
  syncAllLocalTasks,
  syncAllTasksToProvider,
} from "@/providers/sync";
import type { TaskProvider } from "@/types/task";
import type { SyncRecord } from "@/types/sync";
import type { SyncPreflight } from "@/domain/syncPreflight";

export default function SettingsScreen() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const [summary, setSummary] = useState<LocalDataSummary>({
    drafts: 0,
    quality: {
      archivedTasks: 0,
      duplicateGroups: 0,
      openTasks: 0,
      orphanSources: 0,
      pendingDrafts: 0,
      recommendedActions: [],
      sourceBackedTasks: 0,
      sourceCoverageRate: 1,
      timeReviewTasks: 0,
      trustScore: 100,
    },
    sources: 0,
    sourceTypes: {},
    syncRecords: 0,
    tasks: 0,
  });
  const [syncSummary, setSyncSummary] = useState({
    failed: 0,
    pending: 0,
    skipped: 0,
    synced: 0,
    total: 0,
  });
  const [recentSyncRecords, setRecentSyncRecords] = useState<SyncRecord[]>([]);
  const [syncPreflights, setSyncPreflights] = useState<
    Partial<Record<TaskProvider, SyncPreflight>>
  >({});
  const [clearArmed, setClearArmed] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null);
  const [exportSnapshot, setExportSnapshot] = useState<{
    exportedAt: string;
    size: number;
  } | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<TaskProvider | null>(null);
  const [todoistToken, setTodoistTokenState] = useState("");

  useEffect(() => {
    async function loadToken() {
      const token = await getTodoistToken();
      if (token) setTodoistTokenState(token);
    }
    void loadToken();
  }, []);

  const handleSaveTodoistToken = async (val: string) => {
    setTodoistTokenState(val);
    if (val.trim()) {
      await setTodoistToken(val.trim());
    } else {
      await removeTodoistToken();
    }
  };

  const { activeTheme, allThemes, refreshTheme } = useAppTheme();
  const router = useRouter();

  const handleSelectTheme = async (presetId: ThemePresetId) => {
    await setThemePreset(presetId);
    refreshTheme();
  };

  const activePresetObj = activeTheme;
  const baseBgColor = activePresetObj.colors[colorScheme].base;

  const refreshSummary = useCallback(async () => {
    try {
      setSettingsError(null);
      const [nextSummary, nextSyncSummary, records, health, preflights] = await Promise.all([
        getLocalDataSummary(),
        getSyncSummary(),
        getSyncRecords(),
        fetchBackendHealth().catch(() => null),
        Promise.all(
          SYNC_TARGETS.map(async (target) => [
            target.provider,
            await getSyncPreflight(target.provider),
          ] as const),
        ),
      ]);
      setSummary(nextSummary);
      setSyncSummary(nextSyncSummary);
      setBackendHealth(health);
      setSyncPreflights(Object.fromEntries(preflights));
      setRecentSyncRecords(
        records
          .slice()
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          .slice(0, 3),
      );
    } catch (e) {
      setSettingsError(e instanceof Error ? e.message : "加载设置数据失败");
    }
  }, []);

  useEffect(() => {
    void refreshSummary();
  }, [refreshSummary]);

  useFocusEffect(
    useCallback(() => {
      void refreshSummary();
    }, [refreshSummary]),
  );

  const handleClearLocalData = async () => {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }

    await clearAllLocalData();
    setClearArmed(false);
    await refreshSummary();
  };

  const handleSyncLocalTasks = async () => {
    setSyncingProvider("local");
    try {
      await syncAllLocalTasks();
      await refreshSummary();
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleSyncProvider = async (provider: TaskProvider) => {
    setSyncingProvider(provider);
    try {
      await syncAllTasksToProvider(provider);
      await refreshSummary();
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleCreateExportSnapshot = async () => {
    const bundle = await exportAllLocalData();
    setExportSnapshot({
      exportedAt: bundle.exportedAt,
      size: JSON.stringify(bundle).length,
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: baseBgColor },
      ]}
    >
      <View
        style={[
          styles.liquidSurface,
          { backgroundColor: baseBgColor },
        ]}
      >

        <LinearGradient
          colors={[
            Glass.surface.naturalLight[colorScheme],
            Glass.surface.naturalFalloff[colorScheme],
            "rgba(255, 255, 255, 0)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 0.78 }}
          style={styles.naturalLight}
        />
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            Glass.surface.ambientShade[colorScheme],
          ]}
          style={styles.ambientShade}
        />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>设置</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            当前闭环与外部同步边界
          </Text>
        </View>

        {settingsError && (
          <TouchableOpacity
            onPress={() => void refreshSummary()}
            activeOpacity={0.7}
            style={styles.errorBanner}
            accessibilityLabel="加载失败，点击重试"
          >
            <MaterialIcons name="error-outline" size={16} color={StatusColors.danger} />
            <Text style={styles.errorText}>{settingsError}</Text>
            <Text style={[styles.errorRetry, { color: colors.tint }]}>重试</Text>
          </TouchableOpacity>
        )}

        <SettingsStatusPanel
          activeExtractor={EXTRACTOR_CONFIG.ACTIVE_EXTRACTOR}
          backendHealth={backendHealth}
        />

        <InboxQualityPanel quality={summary.quality} />

        <ThemePickerPanel
          activeTheme={activeTheme}
          allThemes={allThemes}
          onCreateTheme={() => router.push("/theme-editor")}
          onSelectTheme={(presetId) => void handleSelectTheme(presetId)}
        />

        <SyncTargetsPanel
          onSaveTodoistToken={(value) => void handleSaveTodoistToken(value)}
          onSyncLocalTasks={() => void handleSyncLocalTasks()}
          onSyncProvider={(provider) => void handleSyncProvider(provider)}
          recentSyncRecords={recentSyncRecords}
          syncingProvider={syncingProvider}
          syncPreflights={syncPreflights}
          syncSummary={syncSummary}
          todoistToken={todoistToken}
        />

        <GlassCard style={styles.panel}>
          <View style={styles.panelTitleGroup}>
            <MaterialIcons name="privacy-tip" size={17} color={colors.tint} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              隐私边界
            </Text>
          </View>
          <Text style={[styles.bodyText, { color: colors.icon }]}>
            模型密钥只放在后端环境变量中。移动端只提交用户主动输入、分享或上传的内容，并且 AI/OCR 结果必须先进入确认卡片。
          </Text>
        </GlassCard>

        <LocalDataPanel
          clearArmed={clearArmed}
          exportSnapshot={exportSnapshot}
          onClearLocalData={() => void handleClearLocalData()}
          onCreateExportSnapshot={() => void handleCreateExportSnapshot()}
          onOpenSourceLibrary={() => router.push("/source-library")}
          onRefresh={() => void refreshSummary()}
          summary={summary}
        />
      </ScrollView>
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
  naturalLight: {
    height: 320,
    left: 0,
    opacity: 0.84,
    position: "absolute",
    right: 0,
    top: 0,
  },
  ambientShade: {
    bottom: 0,
    height: 260,
    left: 0,
    position: "absolute",
    right: 0,
  },
  content: {
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: 110,
  },
  header: {
    gap: Spacing.xxs,
    paddingTop: Spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  panel: {
    borderRadius: Radius.card,
  },
  panelTitleGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: Spacing.sm,
    opacity: Opacity.subtle,
  },
  errorBanner: {
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.08)",
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  errorText: {
    color: StatusColors.danger,
    flex: 1,
    fontSize: 13,
  },
  errorRetry: {
    fontSize: 13,
    fontWeight: "800",
  },
});
