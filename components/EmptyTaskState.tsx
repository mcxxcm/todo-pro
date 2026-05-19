import { StyleSheet } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export function EmptyTaskState() {
  return (
    <ThemedView style={styles.emptyContainer}>
      <ThemedText style={styles.emptyText}>
        暂无任务，输入内容添加一条
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.5,
  },
});
