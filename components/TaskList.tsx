import {
  StyleSheet,
  SectionList,
  ActivityIndicator,
  View,
} from "react-native";
import { NormalizedTask, TaskUpdateInput } from "@/types/task";
import { TaskItem } from "@/components/TaskItem";
import { EmptyTaskState } from "@/components/EmptyTaskState";
import { MotionListItem } from "@/components/ui/MotionListItem";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import { buildTaskSections, type TaskGroupFilter } from "@/domain/taskGrouping";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";
import type { ReactElement } from "react";

interface TaskListProps {
  tasks: NormalizedTask[];
  loading: boolean;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: TaskUpdateInput) => void | Promise<void>;
  onDelete: (id: string) => void;
  activeFilter?: TaskGroupFilter;
  onFilterChange?: (filter: TaskGroupFilter) => void;
  header?: ReactElement | null;
}

export function TaskList({
  tasks,
  loading,
  onToggle,
  onUpdate,
  onDelete,
  activeFilter = "all",
  onFilterChange,
  header,
}: TaskListProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const sections = buildTaskSections(tasks, new Date(), activeFilter);

  if (loading && tasks.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        {header}
        <ActivityIndicator
          style={styles.loader}
          color={colors.tint}
          size="large"
        />
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <MotionListItem index={index} style={styles.listItem}>
          <TaskItem
            task={item}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </MotionListItem>
      )}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: colors.tint }]} />
          <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
          <View style={[
            styles.sectionCountPill,
            { backgroundColor: Glass.inputBackground[colorScheme], borderColor: Glass.border[colorScheme] },
          ]}>
            <ThemedText style={styles.sectionCount}>
              {section.data.length}
            </ThemedText>
          </View>
        </View>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyTaskState
          activeFilter={activeFilter}
          onShowAll={onFilterChange ? () => onFilterChange("all") : undefined}
        />
      }
      contentContainerStyle={sections.length === 0 ? styles.listEmpty : styles.listContent}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  listEmpty: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: Opacity.muted,
  },
  listItem: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    opacity: Opacity.muted,
    textTransform: "uppercase",
  },
  sectionCountPill: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 24,
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionCount: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    opacity: Opacity.muted,
  },
});
