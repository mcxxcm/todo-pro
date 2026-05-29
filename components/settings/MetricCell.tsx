import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { Glass, Radius } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function DataCell({
  label,
  suffix = "",
  value,
}: {
  label: string;
  suffix?: string;
  value: number;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.dataCell,
        {
          backgroundColor: Glass.inputBackground[colorScheme],
          borderColor: Glass.border[colorScheme],
        },
      ]}
    >
      <Text style={[styles.dataValue, { color: colors.text }]}>
        {value}
        {suffix}
      </Text>
      <Text style={[styles.dataLabel, { color: colors.icon }]}>{label}</Text>
    </View>
  );
}

export function PreflightCell({ label, value }: { label: string; value: number }) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.preflightCell,
        {
          backgroundColor: Glass.inputBackground[colorScheme],
          borderColor: Glass.border[colorScheme],
        },
      ]}
    >
      <Text style={[styles.preflightValue, { color: colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.preflightLabel, { color: colors.icon }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dataCell: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  dataValue: {
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  preflightCell: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  preflightLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 1,
  },
  preflightValue: {
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
});
