import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { ReviewCard } from "../../components/ReviewCard";
import type { ExtractedTask } from "../../types/extraction";

jest.mock("@/components/themed-text", () => ({
  ThemedText: ({ children, ...props }: any) => children,
}));
jest.mock("@/components/ui/GlassCard", () => ({
  GlassCard: ({ children, ...props }: any) => children,
}));
jest.mock("@/components/task/TagInput", () => ({
  TagInput: () => null,
}));
jest.mock("@/domain/sourceTimeline", () => ({
  getShortSourceTypeLabel: () => "文本",
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
jest.mock("@/lib/clientTimeParser", () => ({
  parseClientDateInfo: () => null,
}));

const baseTask: ExtractedTask = {
  id: "draft-1",
  title: "候选任务",
  sourceText: "原文内容",
  priority: "medium",
  tags: ["tag1"],
  timeConfidence: "low",
  confidence: 0.8,
  timeStatus: "needs_review",
  dueText: "明天下午",
};

describe("ReviewCard", () => {
  it("renders extracted task title", () => {
    const { getByDisplayValue } = render(
      <ReviewCard
        task={{ ...baseTask, sourceType: "text", status: "pending" }}
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    );
    expect(getByDisplayValue("候选任务")).toBeTruthy();
  });

  it("calls onConfirm with edited title when confirmed", () => {
    const onConfirm = jest.fn();
    const { getByText, getByDisplayValue } = render(
      <ReviewCard
        task={{ ...baseTask, sourceType: "text", status: "pending" }}
        onConfirm={onConfirm}
        onDismiss={jest.fn()}
      />
    );
    fireEvent.changeText(getByDisplayValue("候选任务"), "已编辑标题");
    fireEvent.press(getByText("确认保存"));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: "已编辑标题" })
    );
  });

  it("calls onDismiss when dismiss button pressed", () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = render(
      <ReviewCard
        task={{ ...baseTask, sourceType: "text", status: "pending" }}
        onConfirm={jest.fn()}
        onDismiss={onDismiss}
      />
    );
    fireEvent.press(getByLabelText("忽略候选任务"));
    expect(onDismiss).toHaveBeenCalledWith("draft-1");
  });

  it("calls onFieldChange when dueText is edited", () => {
    const onFieldChange = jest.fn();
    const { getByPlaceholderText } = render(
      <ReviewCard
        task={{ ...baseTask, sourceType: "text", status: "pending" }}
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
        onFieldChange={onFieldChange}
      />
    );
    fireEvent.changeText(getByPlaceholderText("添加截止日期..."), "今天");
    expect(onFieldChange).toHaveBeenCalledWith("draft-1", "dueText", "今天");
  });
});
