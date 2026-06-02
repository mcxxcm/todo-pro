import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { TaskDetailModal } from "../../components/task/TaskDetailModal";
import type { NormalizedTask } from "../../types/task";

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("@/components/ui/GlassCard", () => ({
  GlassCard: ({ children, ...props }: any) => children,
}));
jest.mock("@/components/task/PriorityPicker", () => ({
  PriorityPicker: () => null,
  priorityColor: () => "#FF3B30",
}));
jest.mock("@/components/task/DatePickerModal", () => ({
  DatePickerModal: () => null,
}));
jest.mock("@/components/task/TagInput", () => ({
  TagInput: () => null,
}));
jest.mock("@/components/task/RecurrencePicker", () => ({
  RecurrencePicker: () => null,
}));
jest.mock("@/components/task/FocusTimerModal", () => ({
  FocusTimerModal: () => null,
}));
jest.mock("@/lib/extractionApi", () => ({
  decomposeTask: jest.fn().mockResolvedValue({
    subtasks: [{ id: "ai-sub-1", title: "AI 子任务 1", estimatedMinutes: 15 }],
  }),
}));
jest.mock("@/lib/taskStorage", () => ({
  generateId: () => "mock-id-123",
}));
jest.mock("@/lib/time", () => ({
  getCurrentIsoString: () => "2026-06-02T00:00:00.000Z",
}));
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));
jest.mock("@/constants/theme", () => ({
  Colors: {
    light: { text: "#000", icon: "#888", tint: "#007AFF", background: "#fff" },
    dark: { text: "#fff", icon: "#888", tint: "#0A84FF", background: "#000" },
  },
}));
jest.mock("@/constants/tokens", () => ({
  Glass: {
    border: { light: "#E5E5EA", dark: "#38383A" },
    inputBackground: { light: "#F2F2F7", dark: "#1C1C1E" },
    rim: { light: "#E5E5EA", dark: "#38383A" },
    surface: { ambientShade: { light: "#E5E5EA", dark: "#1C1C1E" } },
  },
  Radius: { card: 12, md: 8, pill: 999 },
  Spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxs: 2 },
  Opacity: { disabled: 0.4, muted: 0.6, subtle: 0.8 },
  StatusColors: { danger: "#FF3B30", success: "#34C759", warning: "#FF9500" },
}));

const baseTask: NormalizedTask = {
  id: "task-1",
  title: "测试任务",
  status: "todo",
  priority: "medium",
  tags: [],
  timeConfidence: "none",
  needsConfirmation: false,
  provider: "local",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  notes: "任务备注",
};

describe("TaskDetailModal", () => {
  it("renders task title when visible", () => {
    const { getByText } = render(
      <TaskDetailModal
        visible={true}
        task={baseTask}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(getByText("测试任务")).toBeTruthy();
  });

  it("renders task notes", () => {
    const { getByText } = render(
      <TaskDetailModal
        visible={true}
        task={baseTask}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(getByText("任务备注")).toBeTruthy();
  });

  it("calls onClose when close button pressed", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <TaskDetailModal
        visible={true}
        task={baseTask}
        onClose={onClose}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    fireEvent.press(getByLabelText("关闭详情"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onDelete when delete button pressed", () => {
    const onDelete = jest.fn();
    const { getByLabelText } = render(
      <TaskDetailModal
        visible={true}
        task={baseTask}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.press(getByLabelText("删除任务"));
    expect(onDelete).toHaveBeenCalledWith("task-1");
  });

  it("shows toggle done button for todo tasks", () => {
    const onToggleDone = jest.fn();
    const { getByLabelText } = render(
      <TaskDetailModal
        visible={true}
        task={baseTask}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        onToggleDone={onToggleDone}
      />
    );
    fireEvent.press(getByLabelText("标记为完成"));
    expect(onToggleDone).toHaveBeenCalledWith("task-1");
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(
      <TaskDetailModal
        visible={false}
        task={baseTask}
        onClose={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(queryByText("测试任务")).toBeNull();
  });
});
