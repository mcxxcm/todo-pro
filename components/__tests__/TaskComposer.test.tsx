import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { TaskComposer } from "../../components/TaskComposer";

jest.mock("@/components/ui/GlassCard", () => ({
  GlassCard: ({ children, ...props }: any) => children,
}));
jest.mock("@/components/ui/GlassButton", () => ({
  GlassButton: ({ children, ...props }: any) => children,
}));
jest.mock("@/components/task/PriorityPicker", () => ({
  PriorityPicker: () => null,
}));
jest.mock("@/components/task/TagInput", () => ({
  TagInput: () => null,
}));
jest.mock("@/components/task/DatePickerModal", () => ({
  DatePickerModal: () => null,
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
}));

describe("TaskComposer", () => {
  it("renders input placeholder", () => {
    const { getByPlaceholderText } = render(
      <TaskComposer onAdd={jest.fn()} />
    );
    expect(getByPlaceholderText("输入任务或随意的一段话...")).toBeTruthy();
  });

  it("calls onAdd when add button pressed", () => {
    const onAdd = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <TaskComposer onAdd={onAdd} />
    );
    fireEvent.changeText(getByPlaceholderText("输入任务或随意的一段话..."), "新任务");
    fireEvent.press(getByText("添加"));
    expect(onAdd).toHaveBeenCalledWith("新任务", undefined, undefined, undefined, undefined);
  });

  it("does not call onAdd when input is empty", () => {
    const onAdd = jest.fn();
    const { getByText } = render(
      <TaskComposer onAdd={onAdd} />
    );
    fireEvent.press(getByText("添加"));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("calls onExtract when AI extract button pressed", () => {
    const onExtract = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <TaskComposer onAdd={jest.fn()} onExtract={onExtract} />
    );
    fireEvent.changeText(getByPlaceholderText("输入任务或随意的一段话..."), "明天开会讨论项目进度");
    fireEvent.press(getByText("AI 提取"));
    expect(onExtract).toHaveBeenCalledWith("明天开会讨论项目进度");
  });
});
