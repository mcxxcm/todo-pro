import { StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { useTasks } from "@/hooks/useTasks";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TaskComposer } from "@/components/TaskComposer";
import { TaskList } from "@/components/TaskList";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function InboxScreen() {
  const { tasks, loading, error, addTask, toggleDone, removeTask, refresh } =
    useTasks();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  if (error) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <ThemedText type="link">重试</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Todo Pro
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          多形式内容的 AI 任务收件箱
        </ThemedText>
      </ThemedView>

      <TaskComposer onAdd={addTask} />

      <TaskList
        tasks={tasks}
        loading={loading}
        onToggle={toggleDone}
        onDelete={removeTask}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    padding: 8,
  },
});
