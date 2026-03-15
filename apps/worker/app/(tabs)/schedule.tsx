import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { apiGet } from "../../lib/api";

const INK = "#0D0D0D";
const PAPER = "#F5F2EC";
const ACCENT = "#E85A2A";
const GREEN = "#4ADE80";
const MUTED = "#8B8580";
const CARD = "#FFFFFF";
const BORDER = "rgba(13,13,13,0.10)";

interface ShiftItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  assignmentStatus: string;
  job: {
    id: string;
    title: string;
    category: string;
    location: string;
    payRate: number;
    client: { name: string };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: "Confirmed", color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
  CLOCKED_IN: { label: "In Progress", color: "#16A34A", bg: "rgba(22,163,74,0.08)" },
  CLOCKED_OUT: { label: "Completed", color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
  NO_SHOW: { label: "No Show", color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  CANCELLED: { label: "Cancelled", color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
};

function getWeekDays(selectedDate: Date): Date[] {
  const start = new Date(selectedDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ScheduleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate.toDateString()]);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    const { data } = await apiGet<ShiftItem[]>("/shifts?upcoming=true");
    setShifts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const shiftDates = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s) => set.add(new Date(s.date).toDateString()));
    return set;
  }, [shifts]);

  const dayShifts = useMemo(
    () => shifts.filter((s) => isSameDay(new Date(s.date), selectedDate)),
    [shifts, selectedDate]
  );

  const weekEarnings = useMemo(() => {
    const start = new Date(weekDays[0]);
    const end = new Date(weekDays[6]);
    end.setHours(23, 59, 59, 999);
    return shifts
      .filter((s) => {
        const d = new Date(s.date);
        return d >= start && d <= end;
      })
      .reduce((sum, s) => {
        const startH = parseInt(s.startTime.split(":")[0], 10);
        const endH = parseInt(s.endTime.split(":")[0], 10);
        const hours = endH > startH ? endH - startH : 0;
        return sum + hours * s.job.payRate;
      }, 0);
  }, [shifts, weekDays]);

  const weekShiftCount = useMemo(() => {
    const start = new Date(weekDays[0]);
    const end = new Date(weekDays[6]);
    end.setHours(23, 59, 59, 999);
    return shifts.filter((s) => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    }).length;
  }, [shifts, weekDays]);

  const navigateWeek = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d);
  };

  const monthLabel = selectedDate.toLocaleDateString("en-SG", { month: "long", year: "numeric" });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Schedule</Text>
      </View>

      {/* Week navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => navigateWeek(-1)} hitSlop={12}>
          <Ionicons name="chevron-back" size={20} color={MUTED} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => navigateWeek(1)} hitSlop={12}>
          <Ionicons name="chevron-forward" size={20} color={MUTED} />
        </TouchableOpacity>
      </View>

      {/* Calendar strip */}
      <View style={styles.calStrip}>
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const hasShift = shiftDates.has(day.toDateString());
          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
              onPress={() => setSelectedDate(new Date(day))}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {DAY_NAMES[day.getDay()]}
              </Text>
              <Text style={[styles.dayNum, isSelected && styles.dayNumSelected, isToday && !isSelected && styles.dayNumToday]}>
                {day.getDate()}
              </Text>
              {hasShift && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Week Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <View>
              <Text style={styles.earningsLabel}>This Week</Text>
              <Text style={styles.earningsValue}>${weekEarnings.toFixed(0)}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View>
              <Text style={styles.earningsLabel}>Shifts</Text>
              <Text style={styles.earningsValue}>{weekShiftCount}</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View>
              <Text style={styles.earningsLabel}>Status</Text>
              <Text style={[styles.earningsValue, { color: GREEN, fontSize: 14 }]}>
                {user?.profile?.isAvailable ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        {/* Day label */}
        <Text style={styles.dayLabel}>
          {isSameDay(selectedDate, new Date())
            ? "Today"
            : selectedDate.toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "short" })}
        </Text>

        {/* Shifts */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : dayShifts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color={BORDER} />
            <Text style={styles.emptyTitle}>No shifts this day</Text>
            <Text style={styles.emptySub}>Check other dates or browse available jobs.</Text>
          </View>
        ) : (
          <View style={styles.shiftList}>
            {dayShifts.map((s) => {
              const status = STATUS_CONFIG[s.assignmentStatus] ?? STATUS_CONFIG.CONFIRMED;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.shiftCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/shift/${s.id}` as never)}
                >
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeStart}>{s.startTime}</Text>
                    <View style={styles.timeLine} />
                    <Text style={styles.timeEnd}>{s.endTime}</Text>
                  </View>
                  <View style={styles.shiftBody}>
                    <Text style={styles.shiftTitle}>{s.job.title}</Text>
                    <Text style={styles.shiftCompany}>{s.job.client.name}</Text>
                    <View style={styles.shiftMeta}>
                      <Ionicons name="location-outline" size={12} color={MUTED} />
                      <Text style={styles.shiftMetaText}>{s.job.location}</Text>
                    </View>
                    <View style={styles.shiftBottom}>
                      <Text style={styles.shiftPay}>${s.job.payRate.toFixed(2)}/hr</Text>
                      <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusPillText, { color: status.color }]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  heading: { fontSize: 28, fontWeight: "700", color: INK },

  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  monthLabel: { fontSize: 15, fontWeight: "600", color: INK },

  calStrip: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: INK,
  },
  dayName: { fontSize: 11, fontWeight: "600", color: MUTED },
  dayNameSelected: { color: "rgba(255,255,255,0.6)" },
  dayNum: { fontSize: 17, fontWeight: "700", color: INK, marginTop: 4 },
  dayNumSelected: { color: "#FFFFFF" },
  dayNumToday: { color: ACCENT },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ACCENT, marginTop: 4 },
  dotSelected: { backgroundColor: "#FFF" },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  earningsCard: {
    backgroundColor: INK,
    borderRadius: 16,
    padding: 18,
  },
  earningsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  earningsLabel: { fontSize: 11, fontWeight: "600", color: MUTED, textTransform: "uppercase", textAlign: "center" },
  earningsValue: { fontSize: 22, fontWeight: "700", color: "#FFF", marginTop: 4, textAlign: "center" },
  earningsDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.12)" },

  dayLabel: { fontSize: 16, fontWeight: "700", color: INK, marginTop: 20, marginBottom: 12 },

  centered: { paddingVertical: 40, alignItems: "center" },

  emptyCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: INK, marginTop: 12 },
  emptySub: { fontSize: 13, color: MUTED, marginTop: 4, textAlign: "center" },

  shiftList: { gap: 12 },
  shiftCard: {
    flexDirection: "row",
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  timeColumn: { width: 50, alignItems: "center", paddingTop: 2 },
  timeStart: { fontSize: 13, fontWeight: "700", color: INK },
  timeLine: { width: 2, flex: 1, backgroundColor: BORDER, marginVertical: 4, borderRadius: 1 },
  timeEnd: { fontSize: 13, fontWeight: "600", color: MUTED },
  shiftBody: { flex: 1, marginLeft: 12 },
  shiftTitle: { fontSize: 15, fontWeight: "700", color: INK },
  shiftCompany: { fontSize: 12, color: MUTED, marginTop: 2 },
  shiftMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  shiftMetaText: { fontSize: 12, color: MUTED },
  shiftBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  shiftPay: { fontSize: 15, fontWeight: "700", color: INK },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 11, fontWeight: "700" },
});
