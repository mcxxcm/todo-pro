import { PropsWithChildren, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

import { Motion } from "@/constants/tokens";

interface MotionListItemProps extends PropsWithChildren {
  index?: number;
  style?: StyleProp<ViewStyle>;
}

export function MotionListItem({
  children,
  index = 0,
  style,
}: MotionListItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue<number>(Motion.translate.listEnterY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (reduceMotion) {
        opacity.value = 1;
        translateY.value = 0 as number;
        setReady(true);
        return;
      }

      const delay = Math.min(
        index * Motion.stagger.listItem,
        Motion.stagger.maxListDelay,
      );

      opacity.value = withDelay(
        delay,
        withTiming(1, {
          duration: Motion.duration.standard,
          easing: Easing.out(Easing.cubic),
        }),
      );
      translateY.value = withDelay(
        delay,
        withTiming(0 as number, {
          duration: Motion.duration.standard,
          easing: Easing.out(Easing.cubic),
        }),
      );
      setReady(true);
    });
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
