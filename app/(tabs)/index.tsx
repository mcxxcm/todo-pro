import { useState } from "react";
import {
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  FlatList,
  Text,
  View,
} from "react-native";
import { useTasks } from "@/hooks/useTasks";
import { useTaskExtraction } from "@/hooks/useTaskExtraction";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TaskComposer } from "@/components/TaskComposer";
import { TaskList } from "@/components/TaskList";
import { ReviewCard } from "@/components/ReviewCard";
import { ExtractedTask } from "@/types/extraction";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function InboxScreen() {
  const { tasks, loading, error, addTask, toggleDone, removeTask, refresh } =
    useTasks();
  const { candidates, extracting, extract, confirmTask, dismissTask, confirmAll, closePanel } =
    useTaskExtraction();
  const [pendingSave, setPendingSave] = useState(false);
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const handleConfirm = async (task: ExtractedTask) => {
    await addTask(task.title, {
      dueAt: task.dueAt,
      notes: task.notes,
    });
    confirmTask(task.id);
  };

  const handleConfirmAll = async () => {
    setPendingSave(true);
    for (const t of candidates) {
      await addTask(t.title, {
        dueAt: t.dueAt,
        notes: t.notes,
      });
    }
    setPendingSave(false);
    confirmAll();
  };

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

      <TaskComposer onAdd={addTask} onExtract={extract} extracting={extracting} />

      <TaskList
        tasks={tasks}
        loading={loading}
        onToggle={toggleDone}
        onDelete={removeTask}
      />

      <Modal
        visible={candidates.length > 0}
        animationType="slide"
        transparent
        onRequestClose={closePanel}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={[
              styles.modalSheet,
              {
                borderColor: colors.icon,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                候选任务 ({candidates.length})
              </ThemedText>
              <TouchableOpacity onPress={closePanel} activeOpacity={0.7}>
                <ThemedText style={styles.modalClose}>关闭</ThemedText>
              </TouchableOpacity>
            </View>

            <FlatList
              data={candidates}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ReviewCard
                  task={item}
                  onConfirm={handleConfirm}
                  onDismiss={dismissTask}
                />
              )}
              style={styles.cardList}
              contentContainerStyle={styles.cardListContent}
              ListEmptyComponent={
                <ThemedText style={styles.emptyText}>
                  暂未识别到任务
                </ThemedText>
              }
            />

            {candidates.length > 1 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[
                    styles.confirmAllButton,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={handleConfirmAll}
                  disabled={pendingSave}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmAllText}>
                    {pendingSave ? "保存中..." : `全部确认 (${candidates.length})`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalClose: {
    fontSize: 15,
    opacity: 0.6,
  },
  cardList: {
    flexGrow: 0,
  },
  cardListContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 40,
    opacity: 0.5,
    fontSize: 15,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 32,
  },
  confirmAllButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmAllText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
