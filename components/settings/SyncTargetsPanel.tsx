import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { DataCell } from "@/components/settings/MetricCell";
import { SyncTargetRow } from "@/components/settings/SyncTargetRow";
import { SYNC_TARGETS } from "@/constants/syncTargets";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import type { SyncPreflight } from "@/domain/syncPreflight";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { SyncRecord } from "@/types/sync";
import type { TaskProvider } from "@/types/task";

export function SyncTargetsPanel({
  onSaveTodoistToken,
  onSyncLocalTasks,
  onSyncProvider,
  recentSyncRecords,
  syncingProvider,
  syncPreflights,
  syncSummary,
  todoistToken,
}: {
  onSaveTodoistToken: (value: string) => void;
  onSyncLocalTasks: () => void;
  onSyncProvider: (provider: TaskProvider) => void;
  recentSyncRecords: SyncRecord[];
  syncingProvider: TaskProvider | null;
  syncPreflights: Partial<Record<TaskProvider, SyncPreflight>>;
  syncSummary: {
    failed: number;
    pending: number;
    skipped: number;
    synced: number;
    total: number;
  };
  todoistToken: string;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <GlassCard style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleGroup}>
          <MaterialIcons name="sync-alt" size={17} color={colors.tint} />
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            同步目标
          </Text>
        </View>
        <Text style={[styles.metaText, { color: colors.icon }]}>
          先本地，后授权
        </Text>
      </View>

      <View style={styles.syncList}>
        {SYNC_TARGETS.map((target) => (
          <SyncTargetRow
            key={target.provider}
            onSaveTodoistToken={onSaveTodoistToken}
            onSyncProvider={onSyncProvider}
            preflight={syncPreflights[target.provider]}
            syncingProvider={syncingProvider}
            target={target}
            todoistToken={todoistToken}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={onSyncLocalTasks}
        disabled={syncingProvider !== null}
        accessibilityLabel="执行本地同步检查"
        activeOpacity={0.7}
        style={[
          styles.syncActionButton,
          {
            borderColor: Glass.border[colorScheme],
            opacity: syncingProvider !== null ? Opacity.disabled : 1,
          },
        ]}
      >
        <MaterialIcons name="sync" size={16} color={colors.tint} />
        <Text style={[styles.syncActionText, { color: colors.tint }]}>
          {syncingProvider ? "同步检查中..." : "执行全部本地同步检查"}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.syncHint, { color: colors.icon }]}>
        Calendar 已具备 ICS 导出格式层；系统日历写入仍需后续授权接入。
      </Text>

      <View style={styles.syncSummaryRow}>
        <DataCell label="记录" value={syncSummary.total} />
        <DataCell label="成功" value={syncSummary.synced} />
        <DataCell label="跳过" value={syncSummary.skipped} />
        <DataCell label="失败" value={syncSummary.failed} />
      </View>

      {recentSyncRecords.length > 0 && (
        <View style={styles.recentSyncList}>
          {recentSyncRecords.map((record) => (
            <View
              key={record.id}
              style={[
                styles.recentSyncRow,
                { borderTopColor: Glass.border[colorScheme] },
              ]}
            >
              <Text style={[styles.recentSyncTitle, { color: colors.text }]}>
                {record.provider} / {record.status}
              </Text>
              <Text style={[styles.recentSyncMeta, { color: colors.icon }]}>
                {record.externalId ?? record.error ?? record.taskId}
              </Text>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  metaText: {
    fontSize: 12,
    fontWeight: "800",
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
  recentSyncList: {
    marginTop: Spacing.sm,
  },
  recentSyncMeta: {
    fontSize: 12,
    fontWeight: "700",
  },
  recentSyncRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  recentSyncTitle: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  syncActionButton: {
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
  syncActionText: {
    fontSize: 13,
    fontWeight: "900",
  },
  syncHint: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: Spacing.xs,
    opacity: Opacity.subtle,
  },
  syncList: {
    marginTop: Spacing.sm,
  },
  syncSummaryRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
});
