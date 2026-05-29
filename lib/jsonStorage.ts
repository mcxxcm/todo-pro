import AsyncStorage from "@react-native-async-storage/async-storage";

export async function loadJsonArray<T>(key: string): Promise<T[]> {
  const json = await AsyncStorage.getItem(key);
  if (!json) return [];

  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (err) {
    console.warn(`[jsonStorage] Failed to parse key "${key}":`, err);
    return [];
  }
}

export async function saveJsonArray<T>(key: string, value: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeJsonValue(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
