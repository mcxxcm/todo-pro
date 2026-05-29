const DEFAULT_BACKEND_URL = "http://localhost:8787";

function normalizeBackendUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : undefined;
}

export const BACKEND_URL =
  normalizeBackendUrl(process.env.EXPO_PUBLIC_BACKEND_URL) ??
  DEFAULT_BACKEND_URL;
