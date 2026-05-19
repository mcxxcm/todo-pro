export const EXTRACTOR_CONFIG: {
  BACKEND_URL: string;
  EXTRACT_ENDPOINT: string;
  ACTIVE_EXTRACTOR: "mock" | "backend";
} = {
  BACKEND_URL: "http://localhost:3000",
  EXTRACT_ENDPOINT: "/api/extract-tasks",
  ACTIVE_EXTRACTOR: "mock",
};
