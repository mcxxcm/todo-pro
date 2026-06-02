import React from "react";
import { render } from "@testing-library/react-native";
import { StatsPanel } from "../settings/StatsPanel";
import type { NormalizedTask } from "@/types/task";

// Mocks
jest.mock("@/components/ui/GlassCard", () => ({
  GlassCard: ({ children }: any) => children,
}));
jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

const mockTasks: NormalizedTask[] = [
  {
    id: "t1",
    title: "Task 1",
    status: "done",
    priority: "none",
    tags: [],
    timeConfidence: "none",
    needsConfirmation: false,
    provider: "local",
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-01T13:00:00.000Z",
    completedAt: "2026-06-01T13:00:00.000Z",
    estimatedMinutes: 30,
    actualMinutes: 45,
    focusSessions: [
      { startedAt: "2026-06-01T12:00:00.000Z", durationMinutes: 25 },
      { startedAt: "2026-06-01T12:30:00.000Z", durationMinutes: 20 },
    ],
  },
  {
    id: "t2",
    title: "Task 2",
    status: "todo",
    priority: "none",
    tags: [],
    timeConfidence: "none",
    needsConfirmation: false,
    provider: "local",
    createdAt: "2026-06-02T12:00:00.000Z",
    updatedAt: "2026-06-02T12:00:00.000Z",
  },
];

describe("StatsPanel", () => {
  it("renders correctly with completion metrics, variance, and focus stats", () => {
    const { getByText } = render(<StatsPanel tasks={mockTasks} />);

    expect(getByText("生产力统计")).toBeTruthy();

    // Completion rate: 1 done, 1 open => 50%
    expect(getByText("50%")).toBeTruthy();
    expect(getByText("完成率")).toBeTruthy();

    // Streak / Completed count
    expect(getByText("已完成")).toBeTruthy();

    // Estimate vs Actual deviation
    // Estimated: 30, Actual: 45 => Deviation +15 minutes
    expect(getByText(/预估 30分钟 · 实际 45分钟/)).toBeTruthy();
    expect(getByText(/偏差 \+15分钟/)).toBeTruthy();

    // Focus sessions stats: 2 sessions, total 45 minutes
    expect(getByText(/专注 2 次 · 共 45分钟/)).toBeTruthy();
  });

  it("returns null when there are no tasks", () => {
    const { toJSON } = render(<StatsPanel tasks={[]} />);
    expect(toJSON()).toBeNull();
  });
});
