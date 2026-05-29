import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { ThemePreset, THEME_PRESETS } from "@/constants/themePresets";
import { getActiveTheme, getCustomThemes } from "@/lib/themeStorage";

export function useAppTheme() {
  const [activeTheme, setActiveTheme] = useState<ThemePreset>(THEME_PRESETS[0]);
  const [customThemes, setCustomThemes] = useState<ThemePreset[]>([]);

  const loadTheme = useCallback(async () => {
    const theme = await getActiveTheme();
    setActiveTheme(theme);
    const custom = await getCustomThemes();
    setCustomThemes(custom);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTheme();
    }, [loadTheme])
  );

  return {
    activeTheme,
    allThemes: [...THEME_PRESETS, ...customThemes],
    customThemes,
    refreshTheme: loadTheme,
  };
}
