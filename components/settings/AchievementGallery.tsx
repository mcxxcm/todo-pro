import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ACHIEVEMENTS, checkAchievements, computeAchievementProgress } from "@/domain/achievements";
import { getUnlockedAchievements, unlockAchievement } from "@/lib/achievementStorage";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { AchievementId, Achievement } from "@/domain/achievements";
import type { NormalizedTask } from "@/types/task";

interface AchievementGalleryProps {
  tasks: NormalizedTask[];
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

export function AchievementGallery({ tasks, onAchievementUnlocked }: AchievementGalleryProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const [unlocked, setUnlocked] = useState<AchievementId[]>([]);

  useEffect(() => {
    void getUnlockedAchievements().then(setUnlocked);
  }, []);

  useEffect(() => {
    const newlyUnlocked = checkAchievements(tasks, unlocked);
    if (newlyUnlocked.length > 0) {
      const ids = newlyUnlocked.map((a) => a.id);
      for (const id of ids) {
        void unlockAchievement(id);
      }
      setUnlocked((prev) => [...prev, ...ids]);
      if (onAchievementUnlocked) {
        newlyUnlocked.forEach((a) => onAchievementUnlocked(a));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const allAchievements = useMemo(
    () => Object.values(ACHIEVEMENTS),
    [],
  );

  const progressMap = useMemo(() => {
    const progress = computeAchievementProgress(tasks);
    return new Map(progress.map((p) => [p.id, p]));
  }, [tasks]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name="emoji-events" size={16} color={colors.tint} />
        <Text style={[styles.title, { color: colors.text }]}>成就</Text>
        <Text style={[styles.count, { color: colors.icon }]}>
          {unlocked.length}/{allAchievements.length}
        </Text>
      </View>

      <View style={styles.grid}>
        {allAchievements.map((achievement) => {
          const isUnlocked = unlocked.includes(achievement.id);
          const progress = progressMap.get(achievement.id);
          const hasProgress = !isUnlocked && progress && progress.target > 0;
          const pct = hasProgress ? Math.min(100, Math.round((progress!.current / progress!.target) * 100)) : 0;
          return (
            <View
              key={achievement.id}
              style={[
                styles.achievement,
                {
                  backgroundColor: isUnlocked
                    ? colors.tint + "12"
                    : Glass.inputBackground[colorScheme],
                  borderColor: isUnlocked ? colors.tint + "40" : Glass.border[colorScheme],
                },
              ]}
            >
              <MaterialIcons
                name={achievement.icon as any}
                size={22}
                color={isUnlocked ? colors.tint : colors.icon}
                style={isUnlocked ? undefined : { opacity: 0.3 }}
              />
              <Text
                style={[
                  styles.achievementTitle,
                  { color: isUnlocked ? colors.tint : colors.icon },
                  !isUnlocked && { opacity: 0.4 },
                ]}
                numberOfLines={1}
              >
                {achievement.title}
              </Text>
              {hasProgress ? (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBarBg, { backgroundColor: Glass.surface.ambientShade[colorScheme] }]}>
                    <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: colors.tint }]} />
                  </View>
                  <Text style={[styles.progressText, { color: colors.icon }]}>
                    {progress.current}/{progress.target}
                  </Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.achievementDesc,
                    { color: colors.icon },
                    !isUnlocked && { opacity: 0.3 },
                  ]}
                  numberOfLines={2}
                >
                  {achievement.description}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  count: {
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  achievement: {
    width: "31%",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.sm,
    gap: 4,
    alignItems: "center",
  },
  achievementTitle: {
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  achievementDesc: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 12,
  },
  progressContainer: {
    width: "100%",
    gap: 2,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
});
