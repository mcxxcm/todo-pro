import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { PriorityPicker, priorityColor } from "@/components/task/PriorityPicker";
import { DatePickerModal } from "@/components/task/DatePickerModal";
import { TagInput } from "@/components/task/TagInput";
import { RecurrencePicker } from "@/components/task/RecurrencePicker";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing, StatusColors } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { generateId } from "@/lib/taskStorage";
import { getCurrentIsoString } from "@/lib/time";
import { decomposeTask } from "@/lib/extractionApi";
import { FocusTimerModal } from "@/components/task/FocusTimerModal";
import type { FocusSession, NormalizedTask, RecurrenceRule, SubTask, TaskPriority, TaskUpdateInput } from "@/types/task";

interface TaskDetailModalProps {
  visible: boolean;
  task: NormalizedTask;
  availableTags?: string[];
  onClose: () => void;
  onUpdate: (id: string, patch: TaskUpdateInput) => void | Promise<void>;
  onDelete: (id: string) => void;
  onToggleDone?: (id: string) => void;
  startInEdit?: boolean;
}

export function TaskDetailModal({
  visible,
  task,
  availableTags,
  onClose,
  onUpdate,
  onDelete,
  onToggleDone,
  startInEdit,
}: TaskDetailModalProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  const [editing, setEditing] = useState(startInEdit ?? false);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [dueAt, setDueAt] = useState(task.dueAt ?? "");
  const [dueText, setDueText] = useState(task.dueText ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority ?? "none");
  const [tags, setTags] = useState<string[]>(task.tags ?? []);
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks ?? []);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | undefined>(
    task.recurrence,
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task.estimatedMinutes?.toString() ?? ""
  );
  const [actualMinutes, setActualMinutes] = useState(
    task.actualMinutes?.toString() ?? ""
  );
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [decomposing, setDecomposing] = useState(false);
  const [decompositionResult, setDecompositionResult] = useState<
    { title: string; estimatedMinutes: number }[] | null
  >(null);
  const [decomposeError, setDecomposeError] = useState<string | null>(null);
  const [decomposeAccepted, setDecomposeAccepted] = useState(false);
  const [focusTimerVisible, setFocusTimerVisible] = useState(false);
  const [editDecomposeIndex, setEditDecomposeIndex] = useState<number | null>(null);
  const [editDecomposeTitle, setEditDecomposeTitle] = useState("");
  const [editDecomposeMins, setEditDecomposeMins] = useState("");
  const [editingActual, setEditingActual] = useState(false);
  const [quickActualMins, setQuickActualMins] = useState("");

  const resetToTask = () => {
    setTitle(task.title);
    setNotes(task.notes ?? "");
    setDueAt(task.dueAt ?? "");
    setDueText(task.dueText ?? "");
    setPriority(task.priority ?? "none");
    setTags(task.tags ?? []);
    setSubtasks(task.subtasks ?? []);
    setEstimatedMinutes(task.estimatedMinutes?.toString() ?? "");
    setActualMinutes(task.actualMinutes?.toString() ?? "");
    setEditingActual(false);
    setQuickActualMins("");
  };

  const handleStartEditing = () => {
    resetToTask();
    setEditing(true);
  };

  const handleCancel = () => {
    resetToTask();
    setEditing(false);
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const est = estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined;
    const act = actualMinutes ? parseInt(actualMinutes, 10) : undefined;

    if (est !== undefined && (isNaN(est) || est <= 0 || est > 1440)) {
      Alert.alert("输入无效", "预估时间必须在 1 至 1440 分钟（24小时）之间。");
      return;
    }

    if (act !== undefined && (isNaN(act) || act <= 0 || act > 1440)) {
      Alert.alert("输入无效", "实际用时必须在 1 至 1440 分钟（24小时）之间。");
      return;
    }

    const patch: TaskUpdateInput = {
      title: trimmedTitle,
      notes: notes.trim() || undefined,
      dueAt: dueAt || undefined,
      dueText: dueText.trim() || undefined,
      priority: priority !== "none" ? priority : undefined,
      tags: tags.length > 0 ? tags : undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      estimatedMinutes: est || undefined,
      actualMinutes: act || undefined,
      recurrence,
    };

    await onUpdate(task.id, patch);
    setEditing(false);
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId
          ? { ...st, status: st.status === "done" ? "todo" : "done", updatedAt: getCurrentIsoString() }
          : st
      )
    );
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    const now = getCurrentIsoString();
    setSubtasks((prev) => [
      ...prev,
      { id: generateId(), title: trimmed, status: "todo", createdAt: now, updatedAt: now },
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
  };

  const handleDecompose = async () => {
    setDecomposing(true);
    setDecomposeError(null);
    setDecompositionResult(null);
    try {
      const result = await decomposeTask({
        title: task.title,
        notes: task.notes,
        dueAt: task.dueAt,
      });
      setDecompositionResult(result.subtasks);
    } catch (e) {
      setDecomposeError(e instanceof Error ? e.message : "拆解失败");
    } finally {
      setDecomposing(false);
    }
  };

  const handleAcceptDecomposition = (index: number) => {
    if (!decompositionResult) return;
    const item = decompositionResult[index];
    const now = getCurrentIsoString();
    const newSubtask = {
      id: generateId(),
      title: item.title,
      status: "todo" as const,
      estimatedMinutes: item.estimatedMinutes,
      createdAt: now,
      updatedAt: now,
    };
    const nextSubtasks = [...subtasks, newSubtask];
    setSubtasks(nextSubtasks);
    setDecompositionResult((prev) => prev?.filter((_, i) => i !== index) ?? null);
    setDecomposeAccepted(true);
    setTimeout(() => setDecomposeAccepted(false), 2000);
    void onUpdate(task.id, { subtasks: nextSubtasks });
  };

  const handleRejectDecomposition = (index: number) => {
    setDecompositionResult((prev) => prev?.filter((_, i) => i !== index) ?? null);
  };

  const handleAcceptAllDecomposition = () => {
    if (!decompositionResult) return;
    const now = getCurrentIsoString();
    const newItems = decompositionResult.map((item) => ({
      id: generateId(),
      title: item.title,
      status: "todo" as const,
      estimatedMinutes: item.estimatedMinutes,
      createdAt: now,
      updatedAt: now,
    }));
    const nextSubtasks = [...subtasks, ...newItems];
    setSubtasks(nextSubtasks);
    setDecompositionResult(null);
    setDecomposeAccepted(true);
    setTimeout(() => setDecomposeAccepted(false), 2000);
    void onUpdate(task.id, { subtasks: nextSubtasks });
  };

  const handleDateSelect = (iso: string, display: string) => {
    setDueAt(iso);
    setDueText(display || "");
  };

  const handleDueTextChange = (text: string) => {
    setDueText(text);
    if (dueAt && text !== dueText) {
      setDueAt("");
    }
  };

  const doneCount = task.subtasks?.filter((st) => st.status === "done").length ?? 0;
  const totalCount = task.subtasks?.length ?? 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <GlassCard style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} accessibilityLabel="关闭详情">
              <MaterialIcons name="close" size={22} color={colors.icon} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              {!editing ? (
                <>
                  <TouchableOpacity
                    onPress={handleStartEditing}
                    style={[styles.headerBtn, { borderColor: Glass.border[colorScheme] }]}
                    accessibilityLabel="编辑任务"
                  >
                    <MaterialIcons name="edit" size={16} color={colors.tint} />
                    <Text style={[styles.headerBtnText, { color: colors.tint }]}>编辑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { onDelete(task.id); onClose(); }}
                    style={[styles.headerBtn, { borderColor: StatusColors.danger + "60" }]}
                    accessibilityLabel="删除任务"
                  >
                    <MaterialIcons name="delete-outline" size={16} color={StatusColors.danger} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleCancel}
                    style={[styles.headerBtn, { borderColor: Glass.border[colorScheme] }]}
                    accessibilityLabel="取消编辑"
                  >
                    <Text style={[styles.headerBtnText, { color: colors.icon }]}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => void handleSave()}
                    style={[styles.headerBtn, styles.saveBtn, { backgroundColor: colors.tint }]}
                    accessibilityLabel="保存"
                  >
                    <Text style={[styles.saveBtnText, colorScheme === "dark" && { color: "#11181C" }]}>
                      保存
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* Title */}
            {editing ? (
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={[styles.titleInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                placeholder="任务标题"
                placeholderTextColor={colors.icon}
              />
            ) : (
              <Text style={[styles.title, { color: task.status === "done" ? colors.icon : colors.text }]}>
                {task.title}
              </Text>
            )}

            {/* Status toggle */}
            <TouchableOpacity
              onPress={() => onToggleDone?.(task.id)}
              style={[styles.statusRow, { borderColor: Glass.border[colorScheme] }]}
              accessibilityLabel={task.status === "done" ? "标记为未完成" : "标记为完成"}
            >
              <MaterialIcons
                name={task.status === "done" ? "check-circle" : "radio-button-unchecked"}
                size={18}
                color={task.status === "done" ? StatusColors.success : colors.icon}
              />
              <Text style={[styles.statusText, { color: task.status === "done" ? StatusColors.success : colors.icon }]}>
                {task.status === "done" ? "已完成" : "待完成"}
              </Text>
            </TouchableOpacity>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.tint }]}>优先级</Text>
              {editing ? (
                <PriorityPicker value={priority} onChange={setPriority} />
              ) : task.priority && task.priority !== "none" ? (
                <View style={styles.valueRow}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor(task.priority, colorScheme) }]} />
                  <Text style={[styles.valueText, { color: colors.text }]}>
                    {task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低"}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.valueText, { color: colors.icon }]}>未设置</Text>
              )}
            </View>

            {/* Due date */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.tint }]}>截止日期</Text>
              {editing ? (
                <View style={styles.dueRow}>
                  <TextInput
                    value={dueText}
                    onChangeText={handleDueTextChange}
                    style={[styles.dueInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                    placeholder="例如：明天下午3点"
                    placeholderTextColor={colors.icon}
                  />
                  <TouchableOpacity
                    onPress={() => setDatePickerVisible(true)}
                    style={[styles.calendarBtn, { borderColor: Glass.border[colorScheme] }]}
                    accessibilityLabel="选择日期"
                  >
                    <MaterialIcons name="calendar-today" size={16} color={colors.tint} />
                  </TouchableOpacity>
                </View>
              ) : task.dueAt ? (
                <View style={styles.valueRow}>
                  <MaterialIcons name="event" size={14} color={colors.icon} />
                  <Text style={[styles.valueText, { color: colors.text }]}>
                    {task.dueText || new Date(task.dueAt).toLocaleString()}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.valueText, { color: colors.icon }]}>未设置</Text>
              )}
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.tint }]}>标签</Text>
              {editing ? (
                <TagInput tags={tags} onChange={setTags} suggestions={availableTags} />
              ) : task.tags && task.tags.length > 0 ? (
                <View style={styles.tagRow}>
                  {task.tags.map((tag, i) => (
                    <View key={`${tag}-${i}`} style={[styles.tagChip, { backgroundColor: colors.tint + "18", borderColor: colors.tint + "40" }]}>
                      <Text style={[styles.tagChipText, { color: colors.tint }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.valueText, { color: colors.icon }]}>无标签</Text>
              )}
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.tint }]}>备注</Text>
              {editing ? (
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  style={[styles.notesInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                  placeholder="补充说明"
                  placeholderTextColor={colors.icon}
                  multiline
                  textAlignVertical="top"
                />
              ) : task.notes ? (
                <Text style={[styles.notesText, { color: colors.text }]}>{task.notes}</Text>
              ) : (
                <Text style={[styles.valueText, { color: colors.icon }]}>无备注</Text>
              )}
            </View>

            {/* Subtasks */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: colors.tint }]}>子任务</Text>
                {totalCount > 0 && (
                  <Text style={[styles.subtaskProgress, { color: colors.icon }]}>
                    {doneCount}/{totalCount}
                  </Text>
                )}
              </View>

              {(editing ? subtasks : task.subtasks ?? []).map((st) => (
                <View key={st.id} style={[styles.subtaskRow, { borderColor: Glass.border[colorScheme] }]}>
                  {editing ? (
                    <TouchableOpacity
                      onPress={() => handleToggleSubtask(st.id)}
                      style={styles.subtaskCheck}
                      accessibilityLabel={st.status === "done" ? "标记子任务未完成" : "标记子任务完成"}
                    >
                      <MaterialIcons
                        name={st.status === "done" ? "check-circle" : "radio-button-unchecked"}
                        size={18}
                        color={st.status === "done" ? StatusColors.success : colors.icon}
                      />
                    </TouchableOpacity>
                  ) : (
                    <MaterialIcons
                      name={st.status === "done" ? "check-circle" : "radio-button-unchecked"}
                      size={18}
                      color={st.status === "done" ? StatusColors.success : colors.icon}
                      style={styles.subtaskCheck}
                    />
                  )}
                  <Text
                    style={[
                      styles.subtaskTitle,
                      { color: st.status === "done" ? colors.icon : colors.text },
                      st.status === "done" && styles.subtaskDone,
                    ]}
                  >
                    {st.title}
                  </Text>
                  {editing && (
                    <TouchableOpacity
                      onPress={() => handleRemoveSubtask(st.id)}
                      accessibilityLabel="删除子任务"
                    >
                      <MaterialIcons name="close" size={14} color={colors.icon} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {editing && (
                <View style={styles.addSubtaskRow}>
                  <TextInput
                    value={newSubtaskTitle}
                    onChangeText={setNewSubtaskTitle}
                    style={[styles.subtaskInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                    placeholder="添加子任务..."
                    placeholderTextColor={colors.icon}
                    onSubmitEditing={handleAddSubtask}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    style={[styles.addSubtaskBtn, { backgroundColor: colors.tint }]}
                    accessibilityLabel="确认添加子任务"
                  >
                    <MaterialIcons name="add" size={16} color={colorScheme === "dark" ? "#11181C" : "#fff"} />
                  </TouchableOpacity>
                </View>
              )}

              {!editing && (!task.subtasks || task.subtasks.length === 0) && (
                <Text style={[styles.valueText, { color: colors.icon }]}>暂无子任务</Text>
              )}

              {!editing && task.subtasks && task.subtasks.length > 0 &&
                task.subtasks.every((st) => st.status === "done") &&
                task.status !== "done" && (
                <TouchableOpacity
                  onPress={() => onToggleDone?.(task.id)}
                  style={[styles.subtaskAllDonePrompt, { borderColor: StatusColors.success + "60", backgroundColor: StatusColors.success + "12" }]}
                  accessibilityLabel="所有子任务已完成，点击完成主任务"
                >
                  <MaterialIcons name="check-circle" size={16} color={StatusColors.success} />
                  <Text style={[styles.subtaskAllDoneText, { color: StatusColors.success }]}>
                    全部子任务已完成，标记主任务为完成？
                  </Text>
                </TouchableOpacity>
              )}

              {decomposeError && (
                <View style={styles.decomposeErrorRow}>
                  <Text style={[styles.errorText, { color: StatusColors.danger, flex: 1 }]}>
                    {decomposeError}
                  </Text>
                  <TouchableOpacity
                    onPress={handleDecompose}
                    style={[styles.retryBtn, { borderColor: StatusColors.danger + "60" }]}
                    accessibilityLabel="重试 AI 拆解"
                  >
                    <MaterialIcons name="refresh" size={14} color={StatusColors.danger} />
                    <Text style={[styles.retryBtnText, { color: StatusColors.danger }]}>重试</Text>
                  </TouchableOpacity>
                </View>
              )}

              {decompositionResult !== null && decompositionResult.length === 0 && (
                <View style={[styles.emptyDecomposeCard, { backgroundColor: colors.tint + "0A", borderColor: colors.tint + "30" }]}>
                  <MaterialIcons name="info-outline" size={16} color={colors.tint} />
                  <Text style={[styles.emptyDecomposeText, { color: colors.text }]}>
                    AI 认为该任务已经足够具体，无需进一步拆解。
                  </Text>
                </View>
              )}

              {decompositionResult && decompositionResult.length > 0 && (
                <View style={styles.decomposeResult}>
                  <View style={styles.decomposeHeader}>
                    <MaterialIcons name="auto-awesome" size={14} color={colors.tint} />
                    <Text style={[styles.decomposeTitle, { color: colors.tint }]}>
                      AI 拆解结果
                    </Text>
                    <TouchableOpacity onPress={handleAcceptAllDecomposition} style={styles.acceptAllBtn}>
                      <Text style={[styles.acceptAllText, { color: StatusColors.success }]}>全部接受</Text>
                    </TouchableOpacity>
                  </View>
                  {decomposeAccepted && (
                    <Text style={[styles.decomposeAccepted, { color: StatusColors.success }]}>
                      已保存到子任务
                    </Text>
                  )}
                  {decompositionResult.map((item, i) => {
                    const editing = editDecomposeIndex === i;
                    return (
                    <View key={i} style={[styles.decomposeItem, { borderColor: Glass.border[colorScheme] }]}>
                      {editing ? (
                        <View style={styles.decomposeEditRow}>
                          <TextInput
                            value={editDecomposeTitle}
                            onChangeText={setEditDecomposeTitle}
                            style={[styles.decomposeEditInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                            placeholder="子任务标题"
                            placeholderTextColor={colors.icon}
                          />
                          <TextInput
                            value={editDecomposeMins}
                            onChangeText={setEditDecomposeMins}
                            style={[styles.decomposeEditMins, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                            placeholder="分钟"
                            placeholderTextColor={colors.icon}
                            keyboardType="numeric"
                          />
                          <TouchableOpacity
                            onPress={() => {
                              const mins = parseInt(editDecomposeMins, 10) || item.estimatedMinutes;
                              // Update the decomposition result in-place
                              const updated = [...decompositionResult];
                              updated[i] = { title: editDecomposeTitle || item.title, estimatedMinutes: mins };
                              setDecompositionResult(updated.length > 0 ? updated : null);
                              setEditDecomposeIndex(null);
                            }}
                            style={styles.decomposeAction}
                            accessibilityLabel="确认编辑"
                          >
                            <MaterialIcons name="check" size={14} color={StatusColors.success} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setEditDecomposeIndex(null)}
                            style={styles.decomposeAction}
                            accessibilityLabel="取消编辑"
                          >
                            <MaterialIcons name="close" size={14} color={colors.icon} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={() => {
                              setEditDecomposeIndex(i);
                              setEditDecomposeTitle(item.title);
                              setEditDecomposeMins(String(item.estimatedMinutes));
                            }}
                            style={styles.decomposeItemTouch}
                            accessibilityLabel={`编辑子任务拆解: ${item.title}`}
                          >
                            <Text style={[styles.decomposeItemTitle, { color: colors.text }]} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <View style={styles.decomposeTimeWithEdit}>
                              <Text style={[styles.decomposeItemTime, { color: colors.icon }]}>
                                ~{item.estimatedMinutes}分钟
                              </Text>
                              <MaterialIcons name="edit" size={12} color={colors.tint} style={styles.editIconHint} />
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleAcceptDecomposition(i)}
                            style={styles.decomposeAction}
                            accessibilityLabel="接受"
                          >
                            <MaterialIcons name="check" size={14} color={StatusColors.success} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleRejectDecomposition(i)}
                            style={styles.decomposeAction}
                            accessibilityLabel="拒绝"
                          >
                            <MaterialIcons name="close" size={14} color={colors.icon} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Estimated time */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.tint }]}>预估时间（分钟）</Text>
              {editing ? (
                <TextInput
                  value={estimatedMinutes}
                  onChangeText={setEstimatedMinutes}
                  style={[styles.estInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                  placeholder="例如：30"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              ) : task.estimatedMinutes ? (
                <Text style={[styles.valueText, { color: colors.text }]}>{task.estimatedMinutes} 分钟</Text>
              ) : (
                <Text style={[styles.valueText, { color: colors.icon }]}>未设置</Text>
              )}
            </View>

            {/* Actual time */}
            <View style={[
              styles.section,
              !editing && task.status === "done" && !task.actualMinutes && {
                padding: Spacing.sm,
                borderRadius: Radius.md,
                borderStyle: "dashed",
                borderWidth: 1.5,
                borderColor: colors.tint + "80",
                backgroundColor: colors.tint + "0A",
                marginTop: 4,
              }
            ]}>
              <Text style={[styles.sectionLabel, { color: colors.tint }]}>实际耗时（分钟）</Text>
              {!editing && task.status === "done" && !task.actualMinutes && (
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.tint, marginBottom: 4 }}>
                  ✨ 恭喜完成任务！建议记录实际耗时以丰富生产力统计：
                </Text>
              )}
              {editing ? (
                <TextInput
                  value={actualMinutes}
                  onChangeText={setActualMinutes}
                  style={[styles.estInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                  placeholder="实际用时"
                  placeholderTextColor={colors.icon}
                  keyboardType="numeric"
                />
              ) : task.actualMinutes ? (
                editingActual ? (
                  <View style={styles.quickActualRow}>
                    <TextInput
                      value={quickActualMins}
                      onChangeText={setQuickActualMins}
                      style={[styles.quickActualInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                      placeholder="实际用时"
                      placeholderTextColor={colors.icon}
                      keyboardType="numeric"
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const mins = parseInt(quickActualMins, 10);
                        if (isNaN(mins) || mins <= 0 || mins > 1440) {
                          Alert.alert("输入无效", "实际用时必须在 1 至 1440 分钟（24小时）之间。");
                          return;
                        }
                        void onUpdate(task.id, { actualMinutes: mins });
                        setEditingActual(false);
                      }}
                      style={[styles.quickActualSave, { backgroundColor: colors.tint }]}
                      accessibilityLabel="保存实际耗时"
                    >
                      <Text style={[styles.quickActualSaveText, colorScheme === "dark" && { color: "#11181C" }]}>保存</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setEditingActual(false)}
                      style={[styles.quickActualSave, { borderColor: Glass.border[colorScheme], borderWidth: StyleSheet.hairlineWidth }]}
                      accessibilityLabel="取消修改"
                    >
                      <Text style={{ color: colors.icon, fontSize: 12, fontWeight: "800" }}>取消</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.valueRow}>
                    <Text style={[styles.valueText, { color: colors.text }]}>{task.actualMinutes} 分钟</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setQuickActualMins(task.actualMinutes?.toString() ?? "");
                        setEditingActual(true);
                      }}
                      accessibilityLabel="修改实际耗时"
                    >
                      <MaterialIcons name="edit" size={14} color={colors.tint} />
                    </TouchableOpacity>
                  </View>
                )
              ) : task.status === "done" ? (
                <View style={styles.quickActualRow}>
                  <TextInput
                    value={actualMinutes}
                    onChangeText={setActualMinutes}
                    style={[styles.quickActualInput, { color: colors.text, borderColor: Glass.border[colorScheme] }]}
                    placeholder="输入实际耗时"
                    placeholderTextColor={colors.icon}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const mins = parseInt(actualMinutes, 10);
                      if (isNaN(mins) || mins <= 0 || mins > 1440) {
                        Alert.alert("输入无效", "实际用时必须在 1 至 1440 分钟（24小时）之间。");
                        return;
                      }
                      void onUpdate(task.id, { actualMinutes: mins });
                      setActualMinutes("");
                    }}
                    disabled={!actualMinutes.trim()}
                    style={[styles.quickActualSave, { backgroundColor: colors.tint, opacity: actualMinutes.trim() ? 1 : 0.4 }]}
                    accessibilityLabel="保存实际耗时"
                  >
                    <Text style={[styles.quickActualSaveText, colorScheme === "dark" && { color: "#11181C" }]}>保存</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.valueText, { color: colors.icon }]}>未记录</Text>
              )}
            </View>

            {/* Recurrence */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.tint }]}>重复</Text>
              {editing ? (
                <RecurrencePicker value={recurrence} onChange={setRecurrence} />
              ) : recurrence ? (
                <View style={styles.valueRow}>
                  <MaterialIcons name="repeat" size={14} color={colors.tint} />
                  <Text style={[styles.valueText, { color: colors.text }]}>
                    {recurrenceLabel(recurrence)}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.valueText, { color: colors.icon }]}>不重复</Text>
              )}
            </View>

            {/* Focus History */}
            {!editing && task.focusSessions && task.focusSessions.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.tint }]}>专注历史</Text>
                <View style={styles.focusHistoryContainer}>
                  {task.focusSessions.map((session, index) => (
                    <View key={index} style={[styles.focusSessionRow, { borderColor: Glass.border[colorScheme] }]}>
                      <MaterialIcons name="timer" size={14} color={colors.tint} />
                      <Text style={[styles.focusSessionText, { color: colors.text }]}>
                        {new Date(session.startedAt).toLocaleString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text style={[styles.focusSessionDuration, { color: colors.icon }]}>
                        专注 {session.durationMinutes} 分钟
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Source info */}
            {task.sourceId && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.tint }]}>来源</Text>
                <View style={styles.valueRow}>
                  <MaterialIcons name="link" size={14} color={colors.icon} />
                  <Text style={[styles.valueText, { color: colors.icon }]}>
                    {task.sourceType ?? "未知"} — {task.sourceText?.slice(0, 60) ?? task.sourceId}
                  </Text>
                </View>
              </View>
            )}

            {/* Action buttons (view mode only) */}
            {!editing && (
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleDecompose}
                  disabled={decomposing}
                  style={[styles.actionBtn, { borderColor: colors.tint + "60" }]}
                  accessibilityLabel="AI 拆解"
                >
                  <MaterialIcons name="auto-awesome" size={16} color={colors.tint} />
                  <Text style={[styles.actionBtnText, { color: colors.tint }]}>
                    {decomposing ? "拆解中..." : "AI 拆解"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFocusTimerVisible(true)}
                  style={[styles.actionBtn, { borderColor: colors.tint + "60" }]}
                  accessibilityLabel="开始专注"
                >
                  <MaterialIcons name="timer" size={16} color={colors.tint} />
                  <Text style={[styles.actionBtnText, { color: colors.tint }]}>开始专注</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Meta info */}
            <View style={styles.metaSection}>
              <Text style={[styles.metaText, { color: colors.icon }]}>
                创建于 {new Date(task.createdAt).toLocaleString()}
              </Text>
              {task.xp !== undefined && task.xp > 0 && (
                <Text style={[styles.metaText, { color: colors.tint }]}>
                  +{task.xp} XP
                </Text>
              )}
            </View>
          </ScrollView>
        </GlassCard>

        <DatePickerModal
          visible={datePickerVisible}
          onClose={() => setDatePickerVisible(false)}
          onSelect={handleDateSelect}
          initialDate={task.dueAt}
        />

        <FocusTimerModal
          visible={focusTimerVisible}
          onClose={() => setFocusTimerVisible(false)}
          onComplete={(session: FocusSession) => {
            const nextSessions = [...(task.focusSessions ?? []), session];
            void onUpdate(task.id, { focusSessions: nextSessions });
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    maxHeight: "90%",
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  headerBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  saveBtn: {
    borderWidth: 0,
    paddingHorizontal: Spacing.md,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    gap: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: "800",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "600",
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dueRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  dueInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  notesInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    minHeight: 80,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  subtaskCheck: {
    marginRight: 2,
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  subtaskDone: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  subtaskProgress: {
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  addSubtaskRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  subtaskInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
  },
  addSubtaskBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  estInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    width: 100,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  metaSection: {
    gap: 2,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    fontWeight: "600",
    paddingTop: 4,
  },
  decomposeResult: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  decomposeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  decomposeTitle: {
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  acceptAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  acceptAllText: {
    fontSize: 11,
    fontWeight: "800",
  },
  decomposeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  decomposeItemTouch: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginRight: 6,
    gap: 4,
  },
  decomposeTimeWithEdit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  editIconHint: {
    opacity: 0.7,
  },
  decomposeItemTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  decomposeItemTime: {
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  decomposeAction: {
    padding: 4,
  },
  decomposeAccepted: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  decomposeEditRow: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.xs,
    alignItems: "center",
  },
  decomposeEditInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  decomposeEditMins: {
    width: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  subtaskAllDonePrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    marginTop: 4,
  },
  subtaskAllDoneText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  quickActualRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    alignItems: "center",
  },
  quickActualInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
  },
  quickActualSave: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  quickActualSaveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  decomposeErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 4,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: StatusColors.danger,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyDecomposeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: 4,
  },
  emptyDecomposeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  focusHistoryContainer: {
    gap: 4,
    marginTop: 2,
  },
  focusSessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  focusSessionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  focusSessionDuration: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
});

function recurrenceLabel(rule: RecurrenceRule): string {
  const freqMap: Record<string, string> = { daily: "天", weekly: "周", monthly: "月", yearly: "年" };
  let label = `每${rule.interval > 1 ? rule.interval : ""}${freqMap[rule.frequency] ?? ""}`;
  if (rule.daysOfWeek?.length) {
    const dayLabels = ["日", "一", "二", "三", "四", "五", "六"];
    label += ` (${rule.daysOfWeek.map((d) => "周" + dayLabels[d]).join("、")})`;
  }
  return label;
}
