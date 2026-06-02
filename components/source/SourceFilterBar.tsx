import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { SourceItemType } from "@/types/source";

export type SourceLibraryFilter = "all" | "orphan" | SourceItemType;

const FILTERS: {
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

interface SourceFilterBarProps {
  activeFilter: SourceLibraryFilter;
  onFilterChange: (filter: SourceLibraryFilter) => void;
}

export function SourceFilterBar({ activeFilter, onFilterChange }: SourceFilterBarProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {FILTERS.map((item) => {
        const active = activeFilter === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            accessibilityLabel={`筛选${item.label}来源`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onFilterChange(item.id)}
            style={[
              styles.chip,
              {
                backgroundColor: active
                  ? colors.tint
                  : Glass.inputBackground[colorScheme],
                borderColor: active ? colors.tint : Glass.border[colorScheme],
              },
            ]}
          >
            <MaterialIcons
              name={item.icon}
              size={13}
              color={active ? (colorScheme === "dark" ? "#11181C" : "#fff") : colors.icon}
            />
            <Text
              style={[
                styles.label,
                {
                  color: active
                    ? colorScheme === "dark"
                      ? "#11181C"
                      : "#fff"
                    : colors.icon,
                },
                active && styles.labelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  chip: {
    alignItems: "center",
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 5,
    minHeight: 34,
    paddingHorizontal: Spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
  labelActive: {
    fontWeight: "900",
  },
});
