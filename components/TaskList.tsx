import { StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { NormalizedTask } from "@/types/task";
import { TaskItem } from "@/components/TaskItem";
import { EmptyTaskState } from "@/components/EmptyTaskState";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TaskListProps {
  tasks: NormalizedTask[];
  loading: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskList({
  tasks,
  loading,
  onToggle,
  onDelete,
}: TaskListProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === "todo" ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (loading && tasks.length === 0) {
    return (
      <ActivityIndicator
        style={styles.loader}
        color={colors.tint}
        size="large"
      />
    );
  }

  return (
    <FlatList
      data={sortedTasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskItem task={item} onToggle={onToggle} onDelete={onDelete} />
      )}
      ListEmptyComponent={EmptyTaskState}
      contentContainerStyle={
        sortedTasks.length === 0 ? styles.listEmpty : styles.listContent
      }
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listEmpty: {
    flexGrow: 1,
  },
});
