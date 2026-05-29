import { PropsWithChildren } from "react";
import { BlurTint, BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  Pressable,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Glass, Radius, Shadows, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface GlassButtonProps extends PropsWithChildren {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  activeOpacity?: number;
  accessibilityLabel?: string;
}

export function GlassButton({
  children,
  onPress,
  style,
  disabled = false,
  accessibilityLabel,
}: GlassButtonProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const blurTint: BlurTint =
    colorScheme === "dark"
      ? "systemUltraThinMaterialDark"
      : "systemUltraThinMaterialLight";

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.84, { duration: 120 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: disabled
              ? colorScheme === "dark"
                ? "rgba(40, 40, 40, 0.22)"
                : "rgba(220, 220, 220, 0.32)"
              : Glass.background[colorScheme],
            borderColor: disabled
              ? colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.08)"
              : Glass.border[colorScheme],
            boxShadow: disabled ? "none" : Shadows.floating[colorScheme],
          },
          animatedStyle,
          style,
        ]}
        {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'glass-button' } } : {})}
      >
        {!disabled && (
          <>
            <BlurView
              tint={blurTint}
              intensity={Glass.blurIntensity[colorScheme]}
              blurMethod="dimezisBlurViewSdk31Plus"
              style={styles.blurLayer}
              {...(Platform.OS === 'web' ? { dataSet: { cssClass: 'glass-blur-button' } } : {})}
            />
            <LinearGradient
              colors={
                colorScheme === "dark"
                  ? [
                      "rgba(240, 250, 255, 0.18)",
                      "rgba(255, 240, 245, 0.06)",
                      "rgba(255, 255, 255, 0)",
                    ]
                  : [
                      "rgba(255, 238, 247, 0.90)", // pink highlight
                      "rgba(238, 247, 255, 0.30)", // blue highlight
                      "rgba(255, 255, 255, 0)",
                    ]
              }
              locations={[0, 0.45, 1]}
              style={styles.topRefraction}
            />
            <View
              style={[
                styles.innerRim,
                {
                  borderColor:
                    colorScheme === "dark"
                      ? "rgba(255, 255, 255, 0.10)"
                      : "rgba(255, 255, 255, 0.65)",
                },
              ]}
            />
            <LinearGradient
              colors={
                colorScheme === "dark"
                  ? ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.35)", "rgba(255, 255, 255, 0)"]
                  : ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.90)", "rgba(255, 255, 255, 0)"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.edgeLineGradient}
            />
          </>
        )}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      },
    }),
  },
  topRefraction: {
    height: 18,
    left: 1,
    position: "absolute",
    right: 1,
    top: 1,
  },
  innerRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radius.button,
    borderWidth: StyleSheet.hairlineWidth,
  },
  edgeLineGradient: {
    height: 1.5,
    left: 1,
    position: "absolute",
    right: 1,
    top: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    zIndex: 1,
  },
});
