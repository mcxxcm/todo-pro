import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadJsonArray, saveJsonArray } from "@/lib/jsonStorage";
import { ThemePresetId, THEME_PRESETS, ThemePreset } from "@/constants/themePresets";

const PRESET_KEY = "@app_theme_preset";
const CUSTOM_THEMES_KEY = "@app_custom_themes";

export async function getThemePreset(): Promise<ThemePresetId> {
  const val = await AsyncStorage.getItem(PRESET_KEY);
  return (val as ThemePresetId) || "dune";
}

export async function setThemePreset(preset: ThemePresetId): Promise<void> {
  await AsyncStorage.setItem(PRESET_KEY, preset);
}

export async function getCustomThemes(): Promise<ThemePreset[]> {
  return loadJsonArray<ThemePreset>(CUSTOM_THEMES_KEY);
}

export async function saveCustomTheme(theme: ThemePreset): Promise<void> {
  const customThemes = await getCustomThemes();
  const existingIndex = customThemes.findIndex((t) => t.id === theme.id);
  if (existingIndex >= 0) {
    customThemes[existingIndex] = theme;
  } else {
    customThemes.push(theme);
  }
  await saveJsonArray(CUSTOM_THEMES_KEY, customThemes);
}

export async function deleteCustomTheme(themeId: string): Promise<void> {
  const customThemes = await getCustomThemes();
  const newThemes = customThemes.filter((t) => t.id !== themeId);
  await saveJsonArray(CUSTOM_THEMES_KEY, newThemes);
}

export async function getActiveTheme(): Promise<ThemePreset> {
  const activeId = await getThemePreset();
  
  // 1. Find in presets
  let preset = THEME_PRESETS.find((p) => p.id === activeId);
  if (preset) return preset;

  // 2. Find in custom themes
  const customThemes = await getCustomThemes();
  preset = customThemes.find((p) => p.id === activeId);
  if (preset) return preset;

  // 3. Fallback
  return THEME_PRESETS[0];
}
