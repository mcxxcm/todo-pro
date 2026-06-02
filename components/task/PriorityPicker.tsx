import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { TaskPriority } from "@/types/task";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "none", label: "无", color: "#9BA1A6" },
  { value: "low", label: "低", color: "#30A0E0" },
  { value: "medium", label: "中", color: "#F5A623" },
  { value: "high", label: "高", color: "#FF3B30" },
];

export function priorityColor(priority: TaskPriority, colorScheme: "dark" | "light"): string {
  const colors = Colors[colorScheme];
  switch (priority) {
    case "high": return "#FF3B30";
    case "medium": return "#F5A623";
    case "low": return "#30A0E0";
    default: return colors.icon;
  }
}

interface PriorityPickerProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  compact?: boolean;
}

export function PriorityPicker({ value, onChange, compact }: PriorityPickerProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <View style={styles.row}>
      {PRIORITY_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.option,
              { borderColor: active ? opt.color : Glass.border[colorScheme] },
              active && { backgroundColor: opt.color + "18" },
            ]}
            accessibilityLabel={`优先级 ${opt.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <MaterialIcons
              name={active ? "flag" : "outlined-flag"}
              size={14}
              color={active ? opt.color : colors.icon}
            />
            {!compact && (
              <Text
                style={[
                  styles.label,
                  { color: active ? opt.color : colors.icon },
                  active && styles.labelActive,
                ]}
              >
                {opt.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.xxs,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
  },
  labelActive: {
    fontWeight: "900",
  },
});
