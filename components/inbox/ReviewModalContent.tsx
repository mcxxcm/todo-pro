import { FlatList, StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { BlurTint, BlurView } from "expo-blur";

import { ReviewCard } from "@/components/ReviewCard";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { Glass } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { ExtractedTask } from "@/types/extraction";
import type { TaskDraft } from "@/types/draft";

interface ReviewModalContentProps {
  candidates: (ExtractedTask & Partial<Pick<TaskDraft, "sourceId" | "sourceType">>)[];
  onClose: () => void;
  onConfirm: (task: ExtractedTask & Partial<Pick<TaskDraft, "sourceId" | "sourceType">>) => void;
  onConfirmAll: () => void;
  onDismiss: (taskId: string) => void;
  onFieldChange: (taskId: string, field: "title" | "dueText" | "dueAt" | "timeStatus", value: string | undefined) => void;
  pendingSave: boolean;
}

export function ReviewModalContent({
  candidates,
  onClose,
  onConfirm,
  onConfirmAll,
  onDismiss,
  onFieldChange,
  pendingSave,
}: ReviewModalContentProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const blurTint: BlurTint =
    colorScheme === "dark"
      ? "systemUltraThinMaterialDark"
      : "systemUltraThinMaterialLight";

  return (
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.modalSheet,
          {
            backgroundColor: "transparent",
            borderColor: Glass.border[colorScheme],
          },
        ]}
      >
        <BlurView
          tint={blurTint}
          intensity={Glass.blurIntensity[colorScheme]}
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFillObject}
          {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'glass-blur' } } : {})}
        />
        <View style={[styles.modalHandle, { backgroundColor: Glass.rim[colorScheme] }]} />
        <View style={styles.modalHeader}>
          <View>
            <ThemedText style={styles.modalTitle}>
              审核草稿
            </ThemedText>
            <Text style={[styles.modalSubtitle, { color: colors.icon }]}>
              {candidates.length} 个候选任务
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.modalClose}>关闭</ThemedText>
          </TouchableOpacity>
        </View>

        <FlatList
          data={candidates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReviewCard
              task={item}
              onConfirm={onConfirm}
              onDismiss={(taskId: string) => void onDismiss(taskId)}
              onFieldChange={onFieldChange}
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
              onPress={onConfirmAll}
              disabled={pendingSave}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmAllText}>
                {pendingSave ? "保存中..." : `全部保存 (${candidates.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 10,
    overflow: "hidden",
  },
  modalHandle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 4,
    marginBottom: 12,
    opacity: 0.72,
    width: 44,
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
  modalSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
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
