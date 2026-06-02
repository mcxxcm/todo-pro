import { useEffect, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing, StatusColors } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentIsoString } from "@/lib/time";
import type { FocusSession } from "@/types/task";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

type Phase = "work" | "break" | "idle";

interface FocusTimerModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (session: FocusSession) => void;
}

/**
 * 番茄钟计时器 Modal。
 * 默认 25 分钟工作 + 5 分钟休息。
 * 完成后写入 task.focusSessions。
 *
 * 已知限制：当前不支持后台/锁屏通知。
 * Phase 3 计划接入 expo-notifications 在计时结束时推送本地通知。
 */
export function FocusTimerModal({ visible, onClose, onComplete }: FocusTimerModalProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<string>("");

  const totalSeconds = phase === "work" ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return clearTimer;
  }, []);

  const startWork = () => {
    setPhase("work");
    setSecondsLeft(WORK_MINUTES * 60);
    setRunning(true);
    setPaused(false);
    sessionStartRef.current = getCurrentIsoString();
    clearTimer();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const togglePause = () => {
    if (paused) {
      setPaused(false);
      clearTimer();
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPaused(true);
      clearTimer();
    }
  };

  const finishEarly = () => {
    clearTimer();
    const elapsedSeconds = totalSeconds - secondsLeft;
    const duration = Math.max(1, Math.round(elapsedSeconds / 60));
    
    const session: FocusSession = {
      startedAt: sessionStartRef.current,
      endedAt: getCurrentIsoString(),
      durationMinutes: duration,
    };
    onComplete(session);

    // Reset timer
    setPhase("idle");
    setRunning(false);
    setPaused(false);
    setSecondsLeft(WORK_MINUTES * 60);
  };

  useEffect(() => {
    if (!running && secondsLeft === 0 && phase === "work") {
      // Work complete - record session
      const session: FocusSession = {
        startedAt: sessionStartRef.current,
        endedAt: getCurrentIsoString(),
        durationMinutes: WORK_MINUTES,
      };
      onComplete(session);
      // Start break
      setPhase("break");
      setSecondsLeft(BREAK_MINUTES * 60);
      setRunning(true);
      setPaused(false);
      clearTimer();
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!running && secondsLeft === 0 && phase === "break") {
      setPhase("idle");
      setPaused(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secondsLeft, phase]);

  const handleClose = () => {
    clearTimer();
    setPhase("idle");
    setRunning(false);
    setPaused(false);
    setSecondsLeft(WORK_MINUTES * 60);
    onClose();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <GlassCard style={styles.card}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {phase === "work" ? (paused ? "已暂停" : "专注中") : phase === "break" ? "休息一下" : "番茄钟"}
            </Text>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="关闭番茄钟">
              <MaterialIcons name="close" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={[styles.timerRing, { borderColor: Glass.border[colorScheme] }]}>
            <View
              style={[
                styles.timerRingFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: phase === "break" ? StatusColors.success : colors.tint,
                },
              ]}
            />
            <Text style={[styles.timerText, { color: colors.text }]}>
              {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </Text>
          </View>

          <Text style={[styles.phaseLabel, { color: colors.icon }]}>
            {phase === "work"
              ? `${WORK_MINUTES} 分钟专注`
              : phase === "break"
                ? `${BREAK_MINUTES} 分钟休息`
                : "开始一段专注时间"}
          </Text>

          {phase === "idle" && (
            <TouchableOpacity
              onPress={startWork}
              style={[styles.startBtn, { backgroundColor: colors.tint }]}
              accessibilityLabel="开始专注"
            >
              <MaterialIcons name="timer" size={18} color={colorScheme === "dark" ? "#11181C" : "#fff"} />
              <Text style={[styles.startBtnText, colorScheme === "dark" && { color: "#11181C" }]}>
                开始
              </Text>
            </TouchableOpacity>
          )}

          {phase === "work" && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={togglePause}
                style={[styles.controlBtn, { borderColor: colors.tint }]}
                accessibilityLabel={paused ? "继续" : "暂停"}
              >
                <MaterialIcons name={paused ? "play-arrow" : "pause"} size={16} color={colors.tint} />
                <Text style={[styles.controlBtnText, { color: colors.tint }]}>
                  {paused ? "继续" : "暂停"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={finishEarly}
                style={[styles.controlBtn, { borderColor: StatusColors.success }]}
                accessibilityLabel="提前结束并记录"
              >
                <MaterialIcons name="done" size={16} color={StatusColors.success} />
                <Text style={[styles.controlBtnText, { color: StatusColors.success }]}>
                  完成
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                style={[styles.controlBtn, { borderColor: colors.icon }]}
                accessibilityLabel="跳过并放弃"
              >
                <MaterialIcons name="close" size={16} color={colors.icon} />
                <Text style={[styles.controlBtnText, { color: colors.icon }]}>
                  放弃
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === "break" && (
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.skipBtn, { borderColor: Glass.border[colorScheme] }]}
              accessibilityLabel="跳过休息"
            >
              <Text style={[styles.skipBtnText, { color: colors.icon }]}>跳过休息</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.disclaimerText, { color: colors.icon }]}>
            * 提示：当前暂不支持后台/锁屏通知，请保持前台运行。
          </Text>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  timerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  timerRingFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "100%",
    opacity: 0.15,
  },
  timerText: {
    fontSize: 40,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  skipBtn: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  disclaimerText: {
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.6,
    textAlign: "center",
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    width: "100%",
    justifyContent: "center",
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    minHeight: 36,
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
