import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { PreflightCell } from "@/components/settings/MetricCell";
import type { SyncTarget } from "@/constants/syncTargets";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import type { SyncPreflight } from "@/domain/syncPreflight";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { TaskProvider } from "@/types/task";

export function SyncTargetRow({
  onSaveTodoistToken,
  onSyncProvider,
  preflight,
  syncingProvider,
  target,
  todoistToken,
}: {
  onSaveTodoistToken: (value: string) => void;
  onSyncProvider: (provider: TaskProvider) => void;
  preflight?: SyncPreflight;
  syncingProvider: TaskProvider | null;
  target: SyncTarget;
  todoistToken: string;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const active = target.status === "active";
  const syncingThisProvider = syncingProvider === target.provider;
  const noEligibleTasks = (preflight?.eligibleTasks ?? 0) === 0;

  return (
    <View
      style={[
        styles.syncRow,
        {
          borderColor: Glass.border[colorScheme],
        },
      ]}
    >
      <View
        style={[
          styles.syncMark,
          {
            backgroundColor: active
              ? colors.tint
              : Glass.inputBackground[colorScheme],
            borderColor: active
              ? colors.tint
              : Glass.border[colorScheme],
          },
        ]}
      >
        <MaterialIcons
          name={active ? "check" : "lock-outline"}
          size={14}
          color={
            active
              ? colorScheme === "dark"
                ? "#11181C"
                : "#fff"
              : colors.icon
          }
        />
      </View>
      <View style={styles.syncCopy}>
        <View style={styles.syncTitleRow}>
          <Text style={[styles.syncTitle, { color: colors.text }]}>
            {target.label}
          </Text>
          <Text
            style={[
              styles.syncStatus,
              { color: active ? colors.tint : colors.icon },
            ]}
          >
            {active ? "已启用" : "预留"}
          </Text>
        </View>
        <Text style={[styles.syncDescription, { color: colors.icon }]}>
          {target.description}
        </Text>
        {preflight && (
          <View style={styles.preflightGrid}>
            <PreflightCell label="可同步" value={preflight.eligibleTasks} />
            <PreflightCell label="已同步" value={preflight.alreadySynced} />
            <PreflightCell label="缺时间" value={preflight.missingTime} />
            <PreflightCell label="待确认" value={preflight.needsTimeReview} />
          </View>
        )}
        {!!preflight?.warnings.length && (
          <Text style={[styles.preflightWarning, { color: colors.icon }]}>
            {preflight.warnings.join(" · ")}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => onSyncProvider(target.provider)}
          disabled={syncingProvider !== null || noEligibleTasks}
          accessibilityLabel={`执行 ${target.label} 同步检查`}
          activeOpacity={0.7}
          style={[
            styles.providerSyncButton,
            {
              borderColor: Glass.border[colorScheme],
              opacity:
                (syncingProvider !== null && !syncingThisProvider) ||
                noEligibleTasks
                  ? Opacity.disabled
                  : 1,
            },
          ]}
        >
          <MaterialIcons
            name={active ? "sync" : "fact-check"}
            size={14}
            color={active ? colors.tint : colors.icon}
          />
          <Text
            style={[
              styles.providerSyncText,
              { color: active ? colors.tint : colors.icon },
            ]}
          >
            {syncingThisProvider
              ? "检查中..."
              : noEligibleTasks
                ? "无可同步"
                : active ? "同步检查" : "导出检查"}
          </Text>
        </TouchableOpacity>
        {target.provider === "todoist" && (
          <View style={styles.tokenContainer}>
            <Text style={[styles.tokenLabel, { color: colors.tint }]}>
              Todoist API Token (Personal · OAuth 计划中)
            </Text>
            <TextInput
              style={[
                styles.tokenInput,
                {
                  backgroundColor: Glass.inputBackground[colorScheme],
                  borderColor: Glass.border[colorScheme],
                  color: colors.text,
                },
              ]}
              value={todoistToken}
              onChangeText={onSaveTodoistToken}
              placeholder="请输入您的 Todoist Token (留空则模拟同步)"
              placeholderTextColor={colors.icon}
              secureTextEntry
              accessibilityLabel="Todoist Token 输入框"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preflightGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  preflightWarning: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 16,
    marginTop: Spacing.xs,
    opacity: Opacity.subtle,
  },
  providerSyncButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.xxs,
    marginTop: Spacing.xs,
    minHeight: 30,
    paddingHorizontal: Spacing.sm,
  },
  providerSyncText: {
    fontSize: 12,
    fontWeight: "900",
  },
  syncCopy: {
    flex: 1,
    minWidth: 0,
  },
  syncDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    opacity: Opacity.subtle,
  },
  syncMark: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 28,
    justifyContent: "center",
    marginTop: 2,
    width: 28,
  },
  syncRow: {
    alignItems: "flex-start",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  syncStatus: {
    fontSize: 12,
    fontWeight: "900",
  },
  syncTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  syncTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  tokenContainer: {
    gap: Spacing.xxs,
    marginTop: Spacing.sm,
    width: "100%",
  },
  tokenInput: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 13,
    fontWeight: "600",
    minHeight: 36,
    paddingHorizontal: Spacing.sm,
    width: "100%",
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
});
