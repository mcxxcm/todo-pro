import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function TimeReviewActionCard({
  count,
  onConfirmAll,
}: {
  count: number;
  onConfirmAll: () => void;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <GlassCard
      style={styles.card}
      contentStyle={styles.content}
    >
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>
          {count} 个时间待确认
        </Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          确认后会保留原始 dueText，并标记为已确认。
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.72}
        accessibilityLabel="全部确认模糊时间"
        accessibilityRole="button"
        onPress={onConfirmAll}
        style={[
          styles.button,
          {
            backgroundColor: Glass.inputBackground[colorScheme],
            borderColor: Glass.border[colorScheme],
          },
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>
          全部确认
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "900",
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "900",
  },
});
