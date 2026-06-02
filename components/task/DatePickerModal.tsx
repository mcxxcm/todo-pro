import { useMemo, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { GlassCard } from "@/components/ui/GlassCard";
import { Colors } from "@/constants/theme";
import { Glass, Radius, Spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";

const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getStartDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (isoString: string, displayText: string) => void;
  initialDate?: string;
}

export function DatePickerModal({ visible, onClose, onSelect, initialDate }: DatePickerModalProps) {
  const now = useMemo(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDate, visible]);

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(0);

  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const colors = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const compact = width < 380;

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleConfirm = () => {
    const date = new Date(year, month, selectedDay, hour, minute);
    const iso = date.toISOString();
    const display = `${year}年${month + 1}月${selectedDay}日 ${pad(hour)}:${pad(minute)}`;
    onSelect(iso, display);
    onClose();
  };

  const handleClear = () => {
    onSelect("", "");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <GlassCard style={[styles.card, { maxWidth: compact ? 320 : 360 }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn} accessibilityLabel="上个月">
              <MaterialIcons name="chevron-left" size={20} color={colors.tint} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {year}年 {MONTHS[month]}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn} accessibilityLabel="下个月">
              <MaterialIcons name="chevron-right" size={20} color={colors.tint} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((wd) => (
              <View key={wd} style={styles.weekdayCell}>
                <Text style={[styles.weekdayText, { color: colors.icon }]}>{wd}</Text>
              </View>
            ))}
          </View>

          {rows.map((row, ri) => (
            <View key={ri} style={styles.dayRow}>
              {row.map((day, di) => {
                if (day === null) return <View key={di} style={styles.dayCell} />;
                const active = day === selectedDay;
                const todayFlag = isToday(day);
                return (
                  <TouchableOpacity
                    key={di}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.dayCell,
                      active && { backgroundColor: colors.tint },
                      todayFlag && !active && { borderColor: colors.tint, borderWidth: 1.5 },
                    ]}
                    accessibilityLabel={`${year}年${month + 1}月${day}日`}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: active ? (colorScheme === "dark" ? "#11181C" : "#fff") : colors.text },
                        todayFlag && !active && { color: colors.tint, fontWeight: "800" },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={styles.timeRow}>
            <Text style={[styles.timeLabel, { color: colors.tint }]}>时间</Text>
            <View style={styles.timePickers}>
              <TouchableOpacity
                onPress={() => setHour((h) => (h + 1) % 24)}
                style={[styles.timeBtn, { borderColor: Glass.border[colorScheme] }]}
              >
                <Text style={[styles.timeText, { color: colors.text }]}>{pad(hour)}</Text>
              </TouchableOpacity>
              <Text style={[styles.timeSep, { color: colors.icon }]}>:</Text>
              <TouchableOpacity
                onPress={() => setMinute((m) => (m + 5) % 60)}
                style={[styles.timeBtn, { borderColor: Glass.border[colorScheme] }]}
              >
                <Text style={[styles.timeText, { color: colors.text }]}>{pad(minute)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <Text style={[styles.clearText, { color: colors.icon }]}>清除日期</Text>
            </TouchableOpacity>

            <View style={styles.footerRight}>
              <TouchableOpacity onPress={onClose} style={[styles.actionBtn, { borderColor: Glass.border[colorScheme] }]}>
                <Text style={[styles.actionText, { color: colors.icon }]}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={[styles.actionBtn, styles.confirmBtn, { backgroundColor: colors.tint }]}
              >
                <Text style={[styles.confirmText, colorScheme === "dark" && { color: "#11181C" }]}>
                  确认
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  card: {
    width: "100%",
    borderRadius: Radius.card,
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  navBtn: {
    padding: 4,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dayRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1,
    borderRadius: Radius.sm,
    margin: 1,
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  timePickers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeBtn: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 52,
    alignItems: "center",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  timeSep: {
    fontSize: 16,
    fontWeight: "800",
    marginHorizontal: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  footerRight: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionBtn: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  confirmBtn: {
    borderWidth: 0,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  confirmText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
