import { PropsWithChildren } from "react";
import { Pressable, StyleProp, StyleSheet, Platform, ViewStyle } from "react-native";
import { BlurTint, BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Glass, Radius, Shadows } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface FloatingActionButtonProps extends PropsWithChildren {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export function FloatingActionButton({
  children,
  onPress,
  style,
  accessibilityLabel,
  disabled = false,
}: FloatingActionButtonProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const blurTint: BlurTint =
    colorScheme === "dark"
      ? "systemUltraThinMaterialDark"
      : "systemUltraThinMaterialLight";

  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    shadowOpacity.value = withTiming(0.6, { duration: 100 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    shadowOpacity.value = withTiming(1, { duration: 150 });
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor: Glass.background[colorScheme],
            borderColor: Glass.border[colorScheme],
            boxShadow: Shadows.floating[colorScheme],
          },
          animatedStyle,
          style,
        ]}
      >
        {!disabled && (
          <BlurView
            tint={blurTint}
            intensity={Glass.blurIntensity[colorScheme]}
            blurMethod="dimezisBlurViewSdk31Plus"
            style={styles.blurLayer}
            {...(Platform.OS === "web"
              ? { dataSet: { cssClass: "glass-blur-button" } }
              : {})}
          />
        )}
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    position: "absolute",
    bottom: 28,
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
      },
    }),
  },
});
