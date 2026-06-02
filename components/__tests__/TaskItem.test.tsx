import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { TaskItem } from "../../components/TaskItem";
import type { NormalizedTask } from "../../types/task";

// Additional mocks not in setup.ts
jest.mock("@/components/themed-text", () => ({
  ThemedText: ({ children, ...props }: any) => children,
}));
jest.mock("@/components/ui/GlassCard", () => ({
  GlassCard: ({ children, ...props }: any) => children,
}));
jest.mock("@/components/task/TaskMetadata", () => {
  const React = require("react");
  return {
    TaskMetadata: ({ task }: any) =>
      React.createElement("React.Fragment", null,
        task.priority !== "none" && React.createElement("Text", null, task.priority === "high" ? "高优先级" : task.priority),
        task.subtasks && task.subtasks.length > 0 && React.createElement("Text", null, `${task.subtasks.filter((s: any) => s.status === "done").length}/${task.subtasks.length}`),
      ),
  };
});
jest.mock("@/components/task/TaskDetailModal", () => ({
  TaskDetailModal: () => null,
}));
jest.mock("@/components/task/PriorityPicker", () => {
  const React = require("react");
  return {
    priorityColor: () => "#FF3B30",
    PriorityPicker: ({ value, onChange }: any) => null,
  };
});
jest.mock("@/domain/sourceTimeline", () => ({
  getSourceTypeLabel: () => "手动",
}));
jest.mock("@/domain/xpLevel", () => ({
  computeTaskXp: () => 15,
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
  Spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxs: 2, xxl: 32 },
  Opacity: { disabled: 0.4, muted: 0.6, subtle: 0.8 },
  StatusColors: { danger: "#FF3B30", success: "#34C759", warning: "#FF9500" },
}));

const baseTask: NormalizedTask = {
  id: "task-1",
  title: "测试任务",
  status: "todo",
  priority: "high",
  tags: ["urgent"],
  timeConfidence: "none",
  needsConfirmation: false,
  provider: "local",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("TaskItem", () => {
  it("renders task title via accessibility label", () => {
    const { getByLabelText } = render(
      <TaskItem
        task={baseTask}
        onToggle={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(getByLabelText("查看任务: 测试任务")).toBeTruthy();
  });

  it("shows done state for completed tasks", () => {
    const doneTask = { ...baseTask, status: "done" as const };
    const { getByLabelText } = render(
      <TaskItem
        task={doneTask}
        onToggle={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(getByLabelText("标记为未完成")).toBeTruthy();
  });

  it("calls onToggle when checkbox is pressed", () => {
    const onToggle = jest.fn();
    const { getByLabelText } = render(
      <TaskItem
        task={baseTask}
        onToggle={onToggle}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    fireEvent.press(getByLabelText("标记为完成"));
    expect(onToggle).toHaveBeenCalledWith("task-1");
  });

  it("calls onDelete when delete button is pressed", () => {
    const onDelete = jest.fn();
    const { getByLabelText } = render(
      <TaskItem
        task={baseTask}
        onToggle={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.press(getByLabelText("删除任务"));
    expect(onDelete).toHaveBeenCalledWith("task-1");
  });

  it("shows priority indicator for high priority", () => {
    const { getByText } = render(
      <TaskItem
        task={baseTask}
        onToggle={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    );
    expect(getByText("高优先级")).toBeTruthy();
  });

  it("enters selection mode with checkbox", () => {
    const onToggleSelection = jest.fn();
    const { getByLabelText } = render(
      <TaskItem
        task={baseTask}
        onToggle={jest.fn()}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
        selectionMode={true}
        selected={false}
        onToggleSelection={onToggleSelection}
      />
    );
    fireEvent.press(getByLabelText("选择"));
    expect(onToggleSelection).toHaveBeenCalledWith("task-1");
  });
});
