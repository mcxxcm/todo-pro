import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { GlassButton } from "@/components/ui/GlassButton";
import { PriorityPicker } from "@/components/task/PriorityPicker";
import { DatePickerModal } from "@/components/task/DatePickerModal";
import { TagInput } from "@/components/task/TagInput";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { TaskPriority } from "@/types/task";

export function TaskEditForm({
  draftDueText,
  draftNotes,
  draftPriority,
  draftTags,
  draftTitle,
  onCancel,
  onChangeDueText,
  onChangeNotes,
  onChangePriority,
  onChangeTags,
  onChangeTitle,
  onSave,
  saving,
  saveDisabled,
}: {
  draftDueText: string;
  draftNotes: string;
  draftPriority: TaskPriority;
  draftTags: string[];
  draftTitle: string;
  onCancel: () => void;
  onChangeDueText: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onChangePriority: (value: TaskPriority) => void;
  onChangeTags: (value: string[]) => void;
  onChangeTitle: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  saveDisabled: boolean;
}) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const inputBackground = Glass.inputBackground[colorScheme];
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  return (
    <View style={styles.editContainer}>
      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.tint }]}>标题</Text>
        <TextInput
          value={draftTitle}
          onChangeText={onChangeTitle}
          placeholder="任务标题"
          placeholderTextColor={colors.icon}
          accessibilityLabel="任务标题"
          returnKeyType="done"
          onSubmitEditing={onSave}
          style={[
            styles.editInput,
            {
              backgroundColor: inputBackground,
              borderColor: colors.icon,
              color: colors.text,
            },
          ]}
        />
      </View>

      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.tint }]}>优先级</Text>
        <PriorityPicker value={draftPriority} onChange={onChangePriority} />
      </View>

      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.tint }]}>时间</Text>
        <View style={styles.timeInputRow}>
          <TextInput
            value={draftDueText}
            onChangeText={onChangeDueText}
            placeholder="例如：明天下午三点"
            placeholderTextColor={colors.icon}
            accessibilityLabel="任务时间"
            style={[
              styles.editInput,
              styles.timeInput,
              {
                backgroundColor: inputBackground,
                borderColor: colors.icon,
                color: colors.text,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() => setDatePickerVisible(true)}
            style={[styles.calendarBtn, { borderColor: colors.icon, backgroundColor: inputBackground }]}
            accessibilityLabel="选择日期"
          >
            <MaterialIcons name="calendar-today" size={14} color={colors.tint} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.tint }]}>标签</Text>
        <TagInput tags={draftTags} onChange={onChangeTags} />
      </View>

      <View style={styles.editField}>
        <Text style={[styles.editLabel, { color: colors.tint }]}>备注</Text>
        <TextInput
          value={draftNotes}
          onChangeText={onChangeNotes}
          placeholder="补充说明"
          placeholderTextColor={colors.icon}
          accessibilityLabel="任务备注"
          multiline
          style={[
            styles.editInput,
            styles.editNotesInput,
            {
              backgroundColor: inputBackground,
              borderColor: colors.icon,
              color: colors.text,
            },
          ]}
        />
      </View>

      <View style={styles.editActions}>
        <GlassButton
          onPress={onCancel}
          style={styles.cancelButton}
          disabled={saving}
          accessibilityLabel="取消编辑"
        >
          <Text style={[styles.cancelText, { color: colors.icon }]}>
            取消
          </Text>
        </GlassButton>
        <GlassButton
          onPress={onSave}
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.tint,
              borderColor: colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          ]}
          disabled={saveDisabled}
          accessibilityLabel="保存任务"
        >
          <Text
            style={[
              styles.saveText,
              colorScheme === "dark" && styles.saveTextDark,
            ]}
          >
            {saving ? "保存中..." : "保存"}
          </Text>
        </GlassButton>
      </View>

      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={(iso, display) => {
          if (iso) {
            onChangeDueText(display);
          } else {
            onChangeDueText("");
          }
        }}
        initialDate={draftDueText ? undefined : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    borderRadius: Radius.md,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: Spacing.sm,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  editActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
    justifyContent: "flex-end",
  },
  editContainer: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  editField: {
    gap: Spacing.xxs,
  },
  editInput: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
    minHeight: 40,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  timeInputRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  timeInput: {
    flex: 1,
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  editNotesInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  saveButton: {
    borderRadius: Radius.md,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: Spacing.md,
  },
  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  saveTextDark: {
    color: "#11181C",
  },
});
