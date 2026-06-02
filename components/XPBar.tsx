import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { computeXpStatus } from "@/domain/xpLevel";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NormalizedTask } from "@/types/task";

interface XPBarProps {
  tasks: NormalizedTask[];
}

export function XPBar({ tasks }: XPBarProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const xpStatus = useMemo(() => computeXpStatus(tasks), [tasks]);

  if (xpStatus.xp === 0) return null;

  const progressPercent = Math.min(100, Math.round(xpStatus.levelProgress * 100));

  return (
    <View style={[styles.container, { backgroundColor: Glass.inputBackground[colorScheme], borderColor: Glass.border[colorScheme] }]}>
      <View style={styles.row}>
        <MaterialIcons name="bolt" size={14} color={colors.tint} />
        <Text style={[styles.levelText, { color: colors.tint }]}>
          Lv.{xpStatus.level}
        </Text>
        <View style={[styles.barBg, { backgroundColor: Glass.surface.ambientShade[colorScheme] }]}>
          <View style={[styles.barFill, { width: `${progressPercent}%`, backgroundColor: colors.tint }]} />
        </View>
        <Text style={[styles.xpText, { color: colors.icon }]}>
          {xpStatus.xp} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xxs,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  levelText: {
    fontSize: 12,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    minWidth: 28,
  },
  barBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  xpText: {
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
