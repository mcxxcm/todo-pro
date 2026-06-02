import { useCallback, useEffect, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import Constants from "expo-constants";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
import { StatsPanel } from "@/components/settings/StatsPanel";
import { SourceEfficiencyPanel } from "@/components/settings/SourceEfficiencyPanel";
import { WeeklyReportPanel } from "@/components/settings/WeeklyReportPanel";
import { AchievementGallery } from "@/components/settings/AchievementGallery";
import { SyncTargetsPanel } from "@/components/settings/SyncTargetsPanel";
import { ThemePickerPanel } from "@/components/settings/ThemePickerPanel";
import { useAuth } from "@/providers/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import * as Notifications from "expo-notifications";
import { getNotificationsEnabled, setNotificationsEnabled } from "@/lib/notificationSettings";
import { requestNotificationPermissions } from "@/providers/notificationProvider";
import type { Achievement } from "@/domain/achievements";
import {
  clearAllLocalData,
  exportAllLocalData,
  getLocalDataSummary,
  LocalDataSummary,
  shareAllLocalData,
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
  const { tasks } = useTasks();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
    fileUri?: string;
    shared?: boolean;
    size: number;
  } | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<TaskProvider | null>(null);
  const [todoistToken, setTodoistTokenState] = useState("");
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const { user, logOut } = useAuth();

  useEffect(() => {
    async function loadToken() {
      const token = await getTodoistToken();
      if (token) setTodoistTokenState(token);
    }
    void loadToken();
  }, []);

  useEffect(() => {
    void getNotificationsEnabled().then(setNotificationsEnabledState);
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

  const handleShareLocalData = async () => {
    const result = await shareAllLocalData();
    setExportSnapshot({
      exportedAt: result.exportedAt,
      fileUri: result.fileUri,
      shared: result.shared,
      size: result.size,
    });
  };

  const handleAuthAction = async () => {
    if (user) {
      await logOut();
      await refreshSummary();
      return;
    }
    router.push("/auth");
  };

  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    if (next) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    setNotificationsEnabledState(next);
    await setNotificationsEnabled(next);
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

        <StatsPanel tasks={tasks} />

        <SourceEfficiencyPanel tasks={tasks} />

        <WeeklyReportPanel tasks={tasks} />

        <AchievementGallery
          tasks={tasks}
          onAchievementUnlocked={(achievement: Achievement) => {
            setToastMessage(`🏆 解锁成就：${achievement.title}`);
            setTimeout(() => setToastMessage(null), 2500);
          }}
        />

        <GlassCard style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleGroup}>
              <MaterialIcons
                name={user ? "cloud-done" : "cloud-off"}
                size={17}
                color={colors.tint}
              />
              <Text style={[styles.panelTitle, { color: colors.text }]}>
                账号与同步
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => void handleAuthAction()}
              activeOpacity={0.7}
              style={[
                styles.accountButton,
                { borderColor: Glass.border[colorScheme] },
              ]}
            >
              <Text style={[styles.accountButtonText, { color: colors.tint }]}>
                {user ? "退出" : "登录"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.bodyText, { color: colors.icon }]}>
            {user
              ? `已登录：${user.email ?? "Firebase 用户"}。当前任务使用云端同步。`
              : "当前为本地模式，任务、草稿和来源只保存在本机。登录后可开启云端任务同步。"}
          </Text>
        </GlassCard>

        <InboxQualityPanel quality={summary.quality} />

        <ThemePickerPanel
          activeTheme={activeTheme}
          allThemes={allThemes}
          onCreateTheme={() => router.push("/theme-editor")}
          onSelectTheme={(presetId) => void handleSelectTheme(presetId)}
        />

        <GlassCard style={styles.panel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleGroup}>
              <MaterialIcons name="notifications" size={17} color={colors.tint} />
              <Text style={[styles.panelTitle, { color: colors.text }]}>
                通知
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => void handleToggleNotifications()}
              activeOpacity={0.7}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: notificationsEnabled ? colors.tint : Glass.inputBackground[colorScheme],
                  borderColor: notificationsEnabled ? colors.tint : Glass.border[colorScheme],
                },
              ]}
              accessibilityLabel={notificationsEnabled ? "关闭通知" : "开启通知"}
            >
              <View style={[styles.toggleKnob, notificationsEnabled && styles.toggleKnobOn]} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.bodyText, { color: colors.icon }]}>
            {notificationsEnabled
              ? "任务到期提醒已开启。截止时间到达时会推送通知。"
              : "任务到期提醒已关闭。开启后将请求通知权限。"}
          </Text>
        </GlassCard>

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
          onShareLocalData={() => void handleShareLocalData()}
          onOpenSourceLibrary={() => router.push("/source-library")}
          onRefresh={() => void refreshSummary()}
          summary={summary}
        />

        <GlassCard style={styles.panel}>
          <View style={styles.panelTitleGroup}>
            <MaterialIcons name="info" size={17} color={colors.tint} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>关于</Text>
          </View>
          <View style={styles.aboutGrid}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.icon }]}>版本</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>
                {Constants.expoConfig?.version ?? "1.0.0"} (build {Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? "1"})
              </Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.icon }]}>平台</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>Expo SDK 55</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: colors.icon }]}>许可</Text>
              <Text style={[styles.aboutValue, { color: colors.text }]}>MIT License</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:feedback@todopro.app")}
            style={[styles.aboutLink, { borderColor: Glass.border[colorScheme] }]}
            accessibilityLabel="发送反馈邮件"
            accessibilityRole="button"
          >
            <MaterialIcons name="mail-outline" size={14} color={colors.tint} />
            <Text style={[styles.aboutLinkText, { color: colors.tint }]}>反馈 / Bug 报告</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://todopro.app/privacy")}
            style={[styles.aboutLink, { borderColor: Glass.border[colorScheme] }]}
            accessibilityLabel="查看隐私政策"
            accessibilityRole="button"
          >
            <MaterialIcons name="privacy-tip" size={14} color={colors.tint} />
            <Text style={[styles.aboutLinkText, { color: colors.tint }]}>隐私政策</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>

      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: Glass.inputBackground[colorScheme], borderColor: colors.tint }]}>
          <Text style={[styles.toastText, { color: colors.text }]}>{toastMessage}</Text>
        </View>
      )}
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
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  panelTitleGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  accountButton: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  accountButtonText: {
    fontSize: 12,
    fontWeight: "900",
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
  toast: {
    position: "absolute",
    bottom: 20,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  toastText: {
    fontSize: 13,
    fontWeight: "800",
  },
  toggleButton: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  toggleKnobOn: {
    alignSelf: "flex-end",
  },
  aboutGrid: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aboutLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  aboutValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  aboutLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  aboutLinkText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
