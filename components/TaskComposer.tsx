import { useEffect, useState, useRef } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import {
  StyleSheet,
  TextInput,
  Text,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface TaskComposerProps {
  onAdd: (title: string) => Promise<unknown> | unknown;
  onExtract?: (text: string) => void;
  extracting?: boolean;
  onImagePicked?: (base64: string) => void;
  ocrScanning?: boolean;
}

async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes("base64,") ? result.split("base64,")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const AnimatedGlassCard = Animated.createAnimatedComponent(GlassCard);

export function TaskComposer({
  onAdd,
  onExtract,
  extracting,
  onImagePicked,
  ocrScanning,
}: TaskComposerProps) {
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const compact = width < 760;

  const canSubmit = !!inputText.trim() && !extracting && !ocrScanning;
  const canExtract = !!inputText.trim() && !extracting;

  const focusScale = useSharedValue(1);
  const extractPulse = useSharedValue(1);

  useEffect(() => {
    if (canExtract) {
      extractPulse.value = withRepeat(
        withSequence(withTiming(0.6, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1,
        true
      );
    } else {
      extractPulse.value = withTiming(1);
    }
  }, [canExtract, extractPulse]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(focusScale.value, { damping: 14, stiffness: 200 }) }],
      shadowOpacity: withTiming(isFocused ? 0.3 : 0.1),
      shadowRadius: withTiming(isFocused ? 15 : 5),
    };
  });

  const animatedExtractButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: canExtract ? extractPulse.value : Opacity.disabled,
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    focusScale.value = 1.02;
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusScale.value = 1;
  };

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAdd = async () => {
    if (!canSubmit) return;
    triggerHaptic();
    const result = await onAdd(inputText);
    if (result !== undefined) {
      setInputText("");
      inputRef.current?.clear();
      handleBlur();
    }
  };

  const handleExtract = () => {
    if (!canExtract || !onExtract) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onExtract(inputText);
  };

  const handlePickImage = async () => {
    triggerHaptic();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: Platform.OS !== "web",
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0] || !onImagePicked) return;

    const asset = result.assets[0];
    const base64 = asset.base64 ?? (await uriToBase64(asset.uri));
    if (base64) onImagePicked(base64);
  };

  const handleTakePhoto = async () => {
    triggerHaptic();
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      base64: Platform.OS !== "web",
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0] || !onImagePicked) return;

    const asset = result.assets[0];
    const base64 = asset.base64 ?? (await uriToBase64(asset.uri));
    if (base64) onImagePicked(base64);
  };

  return (
    <View style={styles.wrapper}>
      <AnimatedGlassCard style={[styles.composerSurface, animatedContainerStyle, isFocused && { borderColor: colors.tint, borderWidth: 1.5 }]}>
        <View style={[styles.inputRow, compact && styles.inputRowCompact]}>
          <View style={[styles.inputShell, !compact && styles.inputShellRow, { borderColor: isFocused ? colors.tint : Glass.border[colorScheme] }]}>
            <MaterialIcons
              name="add-task"
              size={18}
              color={isFocused ? colors.tint : colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                {
                  color: colors.text,
                },
              ]}
              placeholder="输入任务或随意的一段话..."
              placeholderTextColor={colors.icon}
              accessibilityLabel="任务输入"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => void handleAdd()}
              returnKeyType="done"
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </View>
          <View style={[styles.buttonGroup, compact && styles.buttonGroupCompact]}>
            {onImagePicked && (
              <>
                <GlassButton
                  style={styles.ocrButton}
                  onPress={handlePickImage}
                  disabled={ocrScanning || extracting}
                  accessibilityLabel="从图片识别任务"
                >
                  <MaterialIcons
                    name="image"
                    size={16}
                    color={colors.tint}
                  />
                </GlassButton>
                <GlassButton
                  style={styles.ocrButton}
                  onPress={handleTakePhoto}
                  disabled={ocrScanning || extracting}
                  accessibilityLabel="拍照识别任务"
                >
                  <MaterialIcons
                    name="camera-alt"
                    size={16}
                    color={colors.tint}
                  />
                </GlassButton>
              </>
            )}
            {onExtract && (
              <Animated.View style={animatedExtractButtonStyle}>
                <GlassButton
                  style={[styles.extractButton, { borderColor: canExtract ? colors.tint : Glass.border[colorScheme] }]}
                  onPress={handleExtract}
                  disabled={!canExtract}
                  accessibilityLabel="提取任务"
                >
                  <MaterialIcons
                    name="auto-awesome"
                    size={16}
                    color={colors.tint}
                  />
                  <Text
                    style={[styles.extractButtonText, { color: colors.tint }]}
                  >
                    {extracting ? "提取中..." : "AI 提取"}
                  </Text>
                </GlassButton>
              </Animated.View>
            )}
            <GlassButton
              style={[
                styles.addButton,
                {
                  backgroundColor: colors.tint,
                  borderColor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                },
              ]}
              onPress={() => void handleAdd()}
              disabled={!canSubmit}
              accessibilityLabel="添加任务"
            >
              <MaterialIcons
                name="add"
                size={16}
                color={colorScheme === "dark" ? "#11181C" : "#fff"}
              />
              <Text
                style={[
                  styles.addButtonText,
                  colorScheme === "dark" && styles.addButtonTextDark,
                  !canSubmit && styles.addButtonTextDisabled,
                ]}
              >
                添加
              </Text>
            </GlassButton>
          </View>
        </View>
        {ocrScanning && (
          <View style={styles.ocrStatus}>
            <MaterialIcons name="hourglass-top" size={14} color={colors.tint} />
            <Text style={[styles.ocrStatusText, { color: colors.tint }]}>
              识别图片中...
            </Text>
          </View>
        )}
      </AnimatedGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingVertical: Spacing.sm,
    zIndex: 10,
  },
  composerSurface: {
    borderRadius: Radius.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
  },
  inputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  inputRowCompact: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  inputShell: {
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1.5,
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: Spacing.md,
  },
  inputShellRow: {
    flex: 1,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    minHeight: 44,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  buttonGroupCompact: {
    justifyContent: "flex-end",
  },
  ocrButton: {
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: Radius.md,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: Spacing.sm,
  },
  ocrStatus: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  ocrStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  extractButton: {
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.xxs,
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
  },
  extractButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  addButton: {
    alignItems: "center",
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.xxs,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    opacity: 1,
  },
  addButtonDisabled: {
    opacity: Opacity.disabled,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  addButtonTextDark: {
    color: "#11181C",
  },
  addButtonTextDisabled: {
    opacity: Opacity.disabled,
  },
});
