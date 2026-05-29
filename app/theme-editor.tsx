import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, { useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Crypto from "expo-crypto";

import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemePreset } from "@/constants/themePresets";
import { saveCustomTheme, setThemePreset } from "@/lib/themeStorage";
import { useAppTheme } from "@/hooks/use-app-theme";

type ColorMode = "light" | "dark";

export default function ThemeEditorScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[systemColorScheme];
  const { refreshTheme } = useAppTheme();

  const [previewMode, setPreviewMode] = useState<ColorMode>(systemColorScheme);
  const [themeName, setThemeName] = useState("My Custom Theme");

  const [colorsLight, setColorsLight] = useState({
    base: "#f5f4f0",
    blob1: "rgba(180, 175, 168, 0.65)",
    blob2: "rgba(195, 188, 178, 0.55)",
    blob3: "rgba(170, 165, 160, 0.60)",
  });

  const [colorsDark, setColorsDark] = useState({
    base: "#0c0d10",
    blob1: "rgba(220, 210, 200, 0.15)",
    blob2: "rgba(230, 225, 215, 0.12)",
    blob3: "rgba(215, 205, 195, 0.18)",
  });

  const activeColors = previewMode === "light" ? colorsLight : colorsDark;

  const handleSave = async () => {
    const id = `custom_${Crypto.randomUUID()}`;
    const newTheme: ThemePreset = {
      id,
      label: themeName,
      colors: {
        light: colorsLight,
        dark: colorsDark,
      },
    };
    await saveCustomTheme(newTheme);
    await setThemePreset(id);
    await refreshTheme();
    router.back();
  };

  const updateColor = (key: keyof typeof colorsLight, val: string) => {
    if (previewMode === "light") {
      setColorsLight((prev) => ({ ...prev, [key]: val }));
    } else {
      setColorsDark((prev) => ({ ...prev, [key]: val }));
    }
  };

  // Reanimated styles for smooth color morphing
  const animatedBaseStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(activeColors.base, { duration: 800, easing: Easing.out(Easing.cubic) }),
  }));
  const animatedBlob1Style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(activeColors.blob1, { duration: 1200, easing: Easing.out(Easing.cubic) }),
  }));
  const animatedBlob2Style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(activeColors.blob2, { duration: 1400, easing: Easing.out(Easing.cubic) }),
  }));
  const animatedBlob3Style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(activeColors.blob3, { duration: 1600, easing: Easing.out(Easing.cubic) }),
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: systemColorScheme === "dark" ? "#000" : "#fff" }]}>
      {/* Live Preview Background (Animated) */}
      <Animated.View style={[styles.liquidSurface, animatedBaseStyle]}>
        <Animated.View
          style={[styles.liquidBlob, styles.blobPink, animatedBlob1Style]}
          {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'liquid-blob-1' } } : {})}
        />
        <Animated.View
          style={[styles.liquidBlob, styles.blobBlue, animatedBlob2Style]}
          {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'liquid-blob-2' } } : {})}
        />
        <Animated.View
          style={[styles.liquidBlob, styles.blobPeach, animatedBlob3Style]}
          {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'liquid-blob-3' } } : {})}
        />
        <LinearGradient
          colors={[
            Glass.surface.naturalLight[previewMode],
            Glass.surface.naturalFalloff[previewMode],
            "rgba(255, 255, 255, 0)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 0.78 }}
          style={styles.naturalLight}
        />
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            Glass.surface.ambientShade[previewMode],
          ]}
          style={styles.ambientShade}
        />
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="close" size={24} color={activeColors.base === '#0c0d10' ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.base === '#0c0d10' ? '#fff' : '#000' }]}>
          主题编辑器
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>保存使用</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.panel}>
          <View style={styles.panelHeader}>
            <MaterialIcons name="palette" size={20} color={colors.tint} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>基本信息</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.icon }]}>主题名称</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: Glass.inputBackground[systemColorScheme],
                  borderColor: Glass.border[systemColorScheme],
                  color: colors.text,
                },
              ]}
              value={themeName}
              onChangeText={setThemeName}
              placeholder="例如：赛博朋克 2077"
              placeholderTextColor={colors.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.icon }]}>预览模式</Text>
            <View style={styles.modeSwitch}>
              <TouchableOpacity
                onPress={() => setPreviewMode("light")}
                style={[
                  styles.modeButton,
                  previewMode === "light" && { backgroundColor: colors.tint, borderColor: colors.tint },
                ]}
              >
                <Text style={[styles.modeButtonText, previewMode === "light" && { color: "#fff" }]}>浅色模式 (Light)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPreviewMode("dark")}
                style={[
                  styles.modeButton,
                  previewMode === "dark" && { backgroundColor: colors.tint, borderColor: colors.tint },
                ]}
              >
                <Text style={[styles.modeButtonText, previewMode === "dark" && { color: "#fff" }]}>深色模式 (Dark)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.panel}>
          <View style={styles.panelHeader}>
            <MaterialIcons name="format-color-fill" size={20} color={colors.tint} />
            <Text style={[styles.panelTitle, { color: colors.text }]}>
              {previewMode === "light" ? "浅色模式颜色调配" : "深色模式颜色调配"}
            </Text>
          </View>

          <ColorInput label="底层背景 (Base)" value={activeColors.base} onChange={(v) => updateColor("base", v)} />
          <ColorInput label="流体一号 (Blob 1)" value={activeColors.blob1} onChange={(v) => updateColor("blob1", v)} />
          <ColorInput label="流体二号 (Blob 2)" value={activeColors.blob2} onChange={(v) => updateColor("blob2", v)} />
          <ColorInput label="流体三号 (Blob 3)" value={activeColors.blob3} onChange={(v) => updateColor("blob3", v)} />

          <Text style={[styles.hintText, { color: colors.icon }]}>
            * 提示：对于液态玻璃效果，建议流体使用带透明度的 rgba 颜色（例如 rgba(255, 0, 0, 0.4)），以便它们重叠时能产生漂亮的混色效果。深色模式下透明度可以稍低。
          </Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const systemColorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[systemColorScheme];

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.icon }]}>{label}</Text>
      <View style={styles.colorInputRow}>
        <View style={[styles.colorPreview, { backgroundColor: value }]} />
        <TextInput
          style={[
            styles.textInput,
            styles.colorTextInput,
            {
              backgroundColor: Glass.inputBackground[systemColorScheme],
              borderColor: Glass.border[systemColorScheme],
              color: colors.text,
            },
          ]}
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {Platform.OS === 'web' && (
          <input
            type="color"
            value={value.startsWith("#") ? value.slice(0, 7) : "#ffffff"}
            onChange={(e) => {
              // Only works well for hex colors
              onChange(e.target.value);
            }}
            style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  liquidSurface: {
    ...StyleSheet.absoluteFillObject,
  },
  liquidBlob: {
    position: "absolute",
    borderRadius: 9999,
    ...Platform.select({
      web: {
        filter: "blur(90px)",
      },
    }),
  },
  blobPink: {
    width: 380,
    height: 280,
    top: -50,
    left: -80,
    transform: [{ rotate: "18deg" }],
  },
  blobBlue: {
    width: 420,
    height: 220,
    top: 250,
    right: -120,
    transform: [{ rotate: "-28deg" }],
  },
  blobPeach: {
    width: 460,
    height: 300,
    bottom: 50,
    left: -100,
    transform: [{ rotate: "35deg" }],
  },
  naturalLight: {
    height: 360,
    left: 0,
    opacity: 0.86,
    position: "absolute",
    right: 0,
    top: 0,
  },
  ambientShade: {
    bottom: 0,
    height: 260,
    left: 0,
    position: "absolute",
    right: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 20,
  },
  panel: {
    padding: 20,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  modeSwitch: {
    flexDirection: "row",
    gap: 12,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.3)",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(150,150,150,0.8)",
  },
  colorInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  colorPreview: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.3)",
  },
  colorTextInput: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  hintText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  }
});
