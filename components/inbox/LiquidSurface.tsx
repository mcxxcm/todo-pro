import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Glass } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function LiquidSurface({ baseColor }: { baseColor: string }) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";

  return (
    <View
      style={[
        styles.liquidSurface,
        { backgroundColor: baseColor },
      ]}
    >
      <LinearGradient
        colors={[
          Glass.surface.naturalLight[colorScheme],
          Glass.surface.naturalFalloff[colorScheme],
          "rgba(255, 255, 255, 0)",
        ]}
        locations={[0, 0.46, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.86, y: 0.78 }}
        style={styles.naturalLight}
      />
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0)",
          Glass.surface.ambientShade[colorScheme],
        ]}
        style={styles.ambientShade}
      />
      <View
        style={[
          styles.quietLine,
          { backgroundColor: Glass.surface.quietLine[colorScheme] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  liquidSurface: {
    ...StyleSheet.absoluteFillObject,
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
  quietLine: {
    height: 1,
    left: 20,
    opacity: 0.42,
    position: "absolute",
    right: 20,
    top: 96,
  },
});
