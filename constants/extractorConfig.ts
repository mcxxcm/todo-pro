export const EXTRACTOR_CONFIG: {
  ACTIVE_EXTRACTOR: "mock" | "backend";
} = {
  ACTIVE_EXTRACTOR:
    process.env.EXPO_PUBLIC_TASK_EXTRACTOR === "backend" ? "backend" : "mock",
};
