import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Opacity, Radius, Spacing, StatusColors } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getSourceTypeLabel } from "@/domain/sourceTimeline";
import type { SourceItemType } from "@/types/source";
import type { SourceTimelineItem } from "@/domain/sourceTimeline";

const SOURCE_ICONS: Record<SourceItemType, keyof typeof MaterialIcons.glyphMap> = {
  email: "mail-outline",
  image: "image",
  link: "link",
  manual: "edit-note",
  pdf: "picture-as-pdf",
  share: "ios-share",
  text: "article",
};

interface SourceListItemProps {
  item: SourceTimelineItem;
  expanded: boolean;
  onToggle: () => void;
  onExtract: (item: SourceTimelineItem) => void;
  extracting: boolean;
}

export function SourceListItem({
  item,
  expanded,
  onToggle,
  onExtract,
  extracting,
}: SourceListItemProps) {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];

  return (
    <GlassCard
      key={item.id}
      style={[
        styles.itemCard,
        item.isOrphan && {
          borderColor: `${StatusColors.warning}40`,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        accessibilityLabel={`来源详情: ${item.title}`}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemLeft}>
            <View
              style={[
                styles.typeIconWrapper,
                {
                  backgroundColor: Glass.inputBackground[colorScheme],
                  borderColor: Glass.border[colorScheme],
                },
              ]}
            >
              <MaterialIcons
                name={SOURCE_ICONS[item.type] ?? "help-outline"}
                size={16}
                color={colors.tint}
              />
            </View>
            <View style={styles.itemTitleGroup}>
              <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.itemMetaRow}>
                <Text style={[styles.metaText, { color: colors.icon }]}>
                  {getSourceTypeLabel(item.type)}
                </Text>
                <Text style={[styles.metaDot, { color: colors.icon }]}>
                  ·
                </Text>
                <Text style={[styles.metaText, { color: colors.icon }]}>
                  {item.taskCount} 任务 · {item.draftCount} 草稿
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.itemRight}>
            {item.isOrphan && (
              <View style={[styles.orphanBadge, { borderColor: StatusColors.warning }]}>
                <Text style={[styles.orphanBadgeText, { color: StatusColors.warning }]}>
                  孤立
                </Text>
              </View>
            )}
            <MaterialIcons
              name={expanded ? "expand-less" : "expand-more"}
              size={18}
              color={colors.icon}
            />
          </View>
        </View>
        <View style={styles.itemFooter}>
          <Text style={[styles.itemDate, { color: colors.icon }]}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedSection}>
          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: Glass.inputBackground[colorScheme],
                borderColor: Glass.border[colorScheme],
              },
            ]}
          >
            <ThemedText style={styles.previewText} numberOfLines={6}>
              {item.preview}
            </ThemedText>
          </View>
          {item.preview.trim() && (
            <View style={styles.expandActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={extracting}
                onPress={() => onExtract(item)}
                style={[
                  styles.actionButton,
                  {
                    borderColor: colors.tint,
                    opacity: extracting ? Opacity.disabled : 1,
                  },
                ]}
                accessibilityLabel="重新提取任务"
              >
                <MaterialIcons
                  name="auto-awesome"
                  size={16}
                  color={colors.tint}
                />
                <Text style={[styles.actionText, { color: colors.tint }]}>
                  {extracting ? "提取中..." : "重新提取"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: {
    flexDirection: "row",
    gap: Spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  typeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitleGroup: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  itemMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
  },
  metaDot: {
    fontSize: 11,
    fontWeight: "800",
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  orphanBadge: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  orphanBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  itemFooter: {
    flexDirection: "row",
    marginTop: 4,
  },
  itemDate: {
    fontSize: 10,
    fontWeight: "600",
  },
  expandedSection: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  previewBox: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: 140,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 17,
    opacity: Opacity.muted,
  },
  expandActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "800",
  },
});
