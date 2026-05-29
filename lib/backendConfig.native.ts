import { Platform } from "react-native";

const DEFAULT_BACKEND_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8787"
    : "http://localhost:8787";

function normalizeBackendUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : undefined;
}

export const BACKEND_URL =
  (Platform.OS === "android"
    ? normalizeBackendUrl(process.env.EXPO_PUBLIC_ANDROID_BACKEND_URL)
    : undefined) ??
  normalizeBackendUrl(process.env.EXPO_PUBLIC_BACKEND_URL) ??
  DEFAULT_BACKEND_URL;
