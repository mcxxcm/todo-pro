import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import type { ThemePreset, ThemePresetId } from "@/constants/themePresets";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function ThemePickerPanel({
  activeTheme,
  allThemes,
  onCreateTheme,
  onSelectTheme,
}: {
  activeTheme: ThemePreset;
  allThemes: ThemePreset[];
  onCreateTheme: () => void;
  onSelectTheme: (presetId: ThemePresetId) => void;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <GlassCard style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleGroup}>
          <MaterialIcons name="palette" size={17} color={colors.tint} />
          <Text style={[styles.panelTitle, { color: colors.text }]}>
            个性化配色
          </Text>
        </View>
      </View>
      <Text style={[styles.bodyText, { color: colors.icon }]}>
        选择您的液态玻璃背景与流体配色方案：
      </Text>
      <View style={styles.themeGrid}>
        {allThemes.map((preset) => {
          const active = preset.id === activeTheme.id;
          return (
            <TouchableOpacity
              key={preset.id}
              onPress={() => onSelectTheme(preset.id)}
              style={[
                styles.themeOption,
                {
                  backgroundColor: active
                    ? colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 122, 255, 0.05)"
                    : Glass.inputBackground[colorScheme],
                  borderColor: active ? colors.tint : Glass.border[colorScheme],
                },
              ]}
              activeOpacity={0.7}
              accessibilityLabel={`切换到 ${preset.label} 配色`}
            >
              <View style={styles.themeOptionHeader}>
                <Text style={[styles.themeOptionLabel, { color: colors.text }]}>
                  {preset.label}
                </Text>
                {active && (
                  <MaterialIcons name="check-circle" size={14} color={colors.tint} />
                )}
              </View>
              <View style={styles.themeDotContainer}>
                <View
                  style={[
                    styles.themeDot,
                    { backgroundColor: preset.colors[colorScheme].blob1 },
                  ]}
                />
                <View
                  style={[
                    styles.themeDot,
                    {
                      backgroundColor: preset.colors[colorScheme].blob2,
                      marginLeft: -4,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.themeDot,
                    {
                      backgroundColor: preset.colors[colorScheme].blob3,
                      marginLeft: -4,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={onCreateTheme}
          style={[
            styles.themeOption,
            styles.newThemeOption,
            {
              backgroundColor: Glass.inputBackground[colorScheme],
              borderColor: Glass.border[colorScheme],
            },
          ]}
          activeOpacity={0.7}
        >
          <MaterialIcons name="add-circle-outline" size={24} color={colors.icon} />
          <Text style={[styles.themeOptionLabel, styles.newThemeLabel, { color: colors.icon }]}>
            创建自定义主题
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
    marginTop: 4,
    opacity: Opacity.subtle,
  },
  newThemeLabel: {
    marginTop: 8,
  },
  newThemeOption: {
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 100,
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
  themeDot: {
    borderColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 16,
    width: 16,
  },
  themeDotContainer: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 2,
  },
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    width: "100%",
  },
  themeOption: {
    borderRadius: 16,
    borderWidth: 2,
    flexBasis: "48%",
    marginBottom: 12,
    padding: 12,
  },
  themeOptionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  themeOptionLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
});
