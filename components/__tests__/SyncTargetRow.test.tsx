import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { SyncTargetRow } from "../../components/settings/SyncTargetRow";
import type { SyncTarget } from "../../constants/syncTargets";

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("@/components/settings/MetricCell", () => ({
  PreflightCell: () => null,
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

const todoistTarget: SyncTarget = {
  provider: "todoist",
  label: "Todoist",
  status: "active",
  description: "Personal API Token 同步",
};

describe("SyncTargetRow", () => {
  it("renders target label", () => {
    const { getByText } = render(
      <SyncTargetRow
        target={todoistTarget}
        todoistToken=""
        syncingProvider={null}
        onSaveTodoistToken={jest.fn()}
        onSyncProvider={jest.fn()}
      />
    );
    expect(getByText("Todoist")).toBeTruthy();
  });

  it("renders token input for todoist target", () => {
    const { getByPlaceholderText } = render(
      <SyncTargetRow
        target={todoistTarget}
        todoistToken=""
        syncingProvider={null}
        onSaveTodoistToken={jest.fn()}
        onSyncProvider={jest.fn()}
      />
    );
    expect(getByPlaceholderText("请输入您的 Todoist Token (留空则模拟同步)")).toBeTruthy();
  });

  it("calls onSaveTodoistToken when token is entered", () => {
    const onSaveTodoistToken = jest.fn();
    const { getByPlaceholderText } = render(
      <SyncTargetRow
        target={todoistTarget}
        todoistToken=""
        syncingProvider={null}
        onSaveTodoistToken={onSaveTodoistToken}
        onSyncProvider={jest.fn()}
      />
    );
    fireEvent.changeText(getByPlaceholderText("请输入您的 Todoist Token (留空则模拟同步)"), "test-token-123");
    expect(onSaveTodoistToken).toHaveBeenCalledWith("test-token-123");
  });

  it("shows syncing state when provider is syncing", () => {
    const { getByText } = render(
      <SyncTargetRow
        target={todoistTarget}
        todoistToken="existing-token"
        syncingProvider="todoist"
        onSaveTodoistToken={jest.fn()}
        onSyncProvider={jest.fn()}
      />
    );
    expect(getByText("检查中...")).toBeTruthy();
  });
});
