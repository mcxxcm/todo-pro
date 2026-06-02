import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@todopro:notifications_enabled";

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === null) return true; // default: enabled
    return raw === "true";
  } catch {
    return true;
  }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, String(enabled));
}
