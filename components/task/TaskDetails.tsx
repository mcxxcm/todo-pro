import { StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NormalizedTask } from "@/types/task";

export function TaskDetails({ task }: { task: NormalizedTask }) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <View style={styles.detailsContainer}>
      {task.notes && (
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.tint }]}>
            备注
          </Text>
          <ThemedText style={styles.detailValue}>{task.notes}</ThemedText>
        </View>
      )}
      {task.sourceText && (
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.tint }]}>
            来源
          </Text>
          <ThemedText style={styles.detailValue}>
            {task.sourceText}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    minWidth: 40,
  },
  detailRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    opacity: 0.6,
  },
  detailsContainer: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
  },
});
