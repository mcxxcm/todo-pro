import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { RecurrenceFrequency, RecurrenceRule } from "@/types/task";

const FREQ_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "daily", label: "每天" },
  { value: "weekly", label: "每周" },
  { value: "monthly", label: "每月" },
  { value: "yearly", label: "每年" },
];

const WEEKDAYS = [
  { index: 0, label: "日" },
  { index: 1, label: "一" },
  { index: 2, label: "二" },
  { index: 3, label: "三" },
  { index: 4, label: "四" },
  { index: 5, label: "五" },
  { index: 6, label: "六" },
];

interface RecurrencePickerProps {
  value: RecurrenceRule | undefined;
  onChange: (rule: RecurrenceRule | undefined) => void;
}

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const [localRule, setLocalRule] = useState<RecurrenceRule>(
    value ?? { frequency: "daily", interval: 1 },
  );

  const applyChange = (patch: Partial<RecurrenceRule>) => {
    const next = { ...localRule, ...patch };
    setLocalRule(next);
    onChange(next);
  };

  const toggleDayOfWeek = (day: number) => {
    const current = localRule.daysOfWeek ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    applyChange({ daysOfWeek: next.length > 0 ? next : undefined });
  };

  const handleClear = () => {
    onChange(undefined);
  };

  return (
    <View style={styles.container}>
      <View style={styles.freqRow}>
        {FREQ_OPTIONS.map((opt) => {
          const active = localRule.frequency === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => applyChange({ frequency: opt.value })}
              style={[
                styles.freqBtn,
                { borderColor: active ? colors.tint : Glass.border[colorScheme] },
                active && { backgroundColor: colors.tint + "18" },
              ]}
              accessibilityLabel={`重复 ${opt.label}`}
            >
              <Text
                style={[
                  styles.freqText,
                  { color: active ? colors.tint : colors.icon },
                  active && styles.freqTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.intervalRow}>
        <Text style={[styles.label, { color: colors.icon }]}>每</Text>
        <TextInput
          value={String(localRule.interval)}
          onChangeText={(t) => {
            const n = parseInt(t, 10);
            if (!isNaN(n) && n >= 1 && n <= 99) {
              applyChange({ interval: n });
            } else if (t === "") {
              applyChange({ interval: 1 });
            }
          }}
          keyboardType="numeric"
          style={[styles.intervalInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
        />
        <Text style={[styles.label, { color: colors.icon }]}>
          {localRule.frequency === "daily"
            ? "天"
            : localRule.frequency === "weekly"
              ? "周"
              : localRule.frequency === "monthly"
                ? "月"
                : "年"}
        </Text>
      </View>

      {localRule.frequency === "weekly" && (
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((wd) => {
            const active = (localRule.daysOfWeek ?? []).includes(wd.index);
            return (
              <TouchableOpacity
                key={wd.index}
                onPress={() => toggleDayOfWeek(wd.index)}
                style={[
                  styles.weekdayBtn,
                  { borderColor: active ? colors.tint : Glass.border[colorScheme] },
                  active && { backgroundColor: colors.tint, borderColor: colors.tint },
                ]}
                accessibilityLabel={`星期${wd.label}`}
              >
                <Text
                  style={[
                    styles.weekdayText,
                    { color: active ? (colorScheme === "dark" ? "#11181C" : "#fff") : colors.icon },
                  ]}
                >
                  {wd.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={styles.clearRow}>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <MaterialIcons name="close" size={12} color={colors.icon} />
          <Text style={[styles.clearText, { color: colors.icon }]}>移除重复</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  freqRow: {
    flexDirection: "row",
    gap: Spacing.xxs,
  },
  freqBtn: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  freqText: {
    fontSize: 12,
    fontWeight: "700",
  },
  freqTextActive: {
    fontWeight: "900",
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  intervalInput: {
    width: 48,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 4,
  },
  weekdayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "800",
  },
  clearRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
