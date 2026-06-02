import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { FocusTimerModal } from "../../components/task/FocusTimerModal";

jest.mock("@expo/vector-icons/MaterialIcons", () => "MaterialIcons");
jest.mock("@/components/ui/GlassCard", () => ({
  GlassCard: ({ children, ...props }: any) => children,
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
jest.mock("@/lib/time", () => ({
  getCurrentIsoString: () => "2026-06-02T00:00:00.000Z",
}));

jest.useFakeTimers();

describe("FocusTimerModal", () => {
  it("renders idle state with timer display", () => {
    const { getByText } = render(
      <FocusTimerModal
        visible={true}
        onClose={jest.fn()}
        onComplete={jest.fn()}
      />
    );
    expect(getByText("25:00")).toBeTruthy();
    expect(getByText("番茄钟")).toBeTruthy();
  });

  it("renders start button when idle", () => {
    const { getByLabelText } = render(
      <FocusTimerModal
        visible={true}
        onClose={jest.fn()}
        onComplete={jest.fn()}
      />
    );
    expect(getByLabelText("开始专注")).toBeTruthy();
  });

  it("shows pause button after starting", () => {
    const { getByLabelText } = render(
      <FocusTimerModal
        visible={true}
        onClose={jest.fn()}
        onComplete={jest.fn()}
      />
    );
    fireEvent.press(getByLabelText("开始专注"));
    expect(getByLabelText("暂停")).toBeTruthy();
  });

  it("shows resume button after pausing", () => {
    const { getByLabelText } = render(
      <FocusTimerModal
        visible={true}
        onClose={jest.fn()}
        onComplete={jest.fn()}
      />
    );
    fireEvent.press(getByLabelText("开始专注"));
    fireEvent.press(getByLabelText("暂停"));
    expect(getByLabelText("继续")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(
      <FocusTimerModal
        visible={false}
        onClose={jest.fn()}
        onComplete={jest.fn()}
      />
    );
    expect(queryByText("番茄钟")).toBeNull();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});
