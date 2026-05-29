import { PropsWithChildren } from "react";
import { BlurTint, BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StyleProp, StyleSheet, View, ViewStyle, ViewProps, Platform } from "react-native";

import { Glass, Radius, Shadows, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface GlassCardProps extends PropsWithChildren, Pick<ViewProps, "accessibilityRole" | "accessibilityLabel" | "accessibilityHint" | "accessibilityState"> {
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function GlassCard({ children, style, contentStyle, ...a11yProps }: GlassCardProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const blurTint: BlurTint =
    colorScheme === "dark"
      ? "systemUltraThinMaterialDark"
      : "systemUltraThinMaterialLight";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: Glass.background[colorScheme],
          borderColor: Glass.border[colorScheme],
          boxShadow: Shadows.card[colorScheme],
        },
        style,
      ]}
      {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'glass-card' } } : {})}
      {...a11yProps}
    >
      <BlurView
        tint={blurTint}
        intensity={Glass.blurIntensity[colorScheme]}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={styles.blurLayer}
        {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'glass-blur' } } : {})}
      />
      <View
        style={[
          styles.liquidFill,
          {
            backgroundColor: Glass.background[colorScheme],
          },
        ]}
      />
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? [
                "rgba(240, 250, 255, 0.16)",
                "rgba(255, 240, 245, 0.05)",
                "rgba(255, 255, 255, 0)",
              ]
            : [
                "rgba(255, 238, 247, 0.95)", // pinkish highlight
                "rgba(238, 247, 255, 0.35)", // cyanish highlight
                "rgba(255, 255, 255, 0)",
              ]
        }
        locations={[0, 0.45, 1]}
        style={styles.topRefraction}
      />
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? [
                "rgba(255, 240, 250, 0.12)",
                "rgba(240, 248, 255, 0.03)",
                "rgba(255, 255, 255, 0)",
              ]
            : [
                "rgba(255, 235, 245, 0.65)", // pink reflection
                "rgba(235, 245, 255, 0.22)", // blue reflection
                "rgba(255, 255, 255, 0)",
              ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.specularSweep}
      />
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0)",
          Glass.depth[colorScheme],
          colorScheme === "dark"
            ? "rgba(0, 0, 0, 0.22)"
            : "rgba(10, 24, 30, 0.045)",
        ]}
        locations={[0, 0.52, 1]}
        style={styles.depthWash}
      />
      <View
        style={[
          styles.innerRim,
          {
            borderColor:
              colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.11)"
                : "rgba(255, 255, 255, 0.78)",
          },
        ]}
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
      <LinearGradient
        colors={[
          "rgba(255, 255, 255, 0)",
          colorScheme === "dark"
            ? "rgba(240, 248, 255, 0.08)"
            : "rgba(235, 245, 255, 0.25)",
        ]}
        style={styles.bottomLens}
      />
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.38)", "rgba(255, 255, 255, 0)"]
            : ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.90)", "rgba(255, 255, 255, 0)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.edgeLineGradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative",
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
      },
    }),
  },
  liquidFill: {
    ...StyleSheet.absoluteFillObject,
  },
  topRefraction: {
    height: 26,
    left: 1,
    position: "absolute",
    right: 1,
    top: 1,
  },
  specularSweep: {
    height: 64,
    left: -24,
    opacity: 0.42,
    position: "absolute",
    right: 0,
    top: -22,
    transform: [{ rotate: "-3deg" }],
  },
  depthWash: {
    bottom: -12,
    height: 44,
    left: 0,
    position: "absolute",
    right: 0,
  },
  innerRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bottomLens: {
    bottom: 0,
    height: 9,
    left: 0,
    position: "absolute",
    right: 0,
  },
  edgeLineGradient: {
    height: 1.5,
    left: 1,
    position: "absolute",
    right: 1,
    top: 0,
  },
});
