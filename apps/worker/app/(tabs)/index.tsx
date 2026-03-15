import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { apiGet } from "../../lib/api";
import { supabase } from "../../lib/supabase";

const INK = "#0D0D0D";
const PAPER = "#F5F2EC";
const ACCENT = "#E85A2A";
const ACCENT2 = "#2A7AE8";
const GOLD = "#C8A84B";
const GREEN = "#4ADE80";
const MUTED = "#8B8580";
const CARD = "#FFFFFF";
const BORDER = "rgba(13,13,13,0.10)";

interface UpcomingShift {
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
    client: { id: string; name: string; industry: string };
  };
}

interface RecommendedJob {
  id: string;
  title: string;
  category: string;
  location: string;
  payRate: number;
  slotsTotal: number;
  slotsFilled: number;
  client: { name: string };
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [shifts, setShifts] = useState<UpcomingShift[]>([]);
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const profile = user?.profile;
  const name = user?.name ?? "Worker";

  const fetchData = useCallback(async () => {
    const [shiftsRes, jobsRes, notifRes] = await Promise.all([
      apiGet<UpcomingShift[]>("/shifts?upcoming=true"),
      apiGet<RecommendedJob[]>("/jobs"),
      apiGet<Array<{ read: boolean }>>("/notifications"),
    ]);
    setShifts(shiftsRes.data ?? []);
    setJobs((jobsRes.data ?? []).slice(0, 2));
    const unread = (notifRes.data ?? []).filter((n) => !n.read).length;
    setUnreadCount(unread);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("notifications-home")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Notification", filter: `userId=eq.${user.id}` },
        () => { setUnreadCount((c) => c + 1); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const thisWeekEarnings = (() => {
    if (!profile) return 0;
    const earnings = (profile as unknown as { earnings?: Array<{ periodEnd: string; netAmount: number }> }).earnings;
    if (!earnings?.length) return 0;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return earnings
      .filter((e) => new Date(e.periodEnd) >= weekStart)
      .reduce((sum, e) => sum + e.netAmount, 0);
  })();

  const activeShiftCount = shifts.filter(
    (s) => s.assignmentStatus === "CONFIRMED" || s.assignmentStatus === "CLOCKED_IN"
  ).length;

  const nextShift = shifts[0] ?? null;

  const formatDay = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? "star" : "star-outline"}
          size={14}
          color={GOLD}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* Dark greeting band */}
        <View style={styles.greetingBand}>
          <View style={styles.greetingTopRow}>
            <View>
              <Text style={styles.greetingLabel}>Hi there,</Text>
              <Text style={styles.greetingName}>{name}</Text>
            </View>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push("/notifications" as never)}
            >
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.chipRow}>
            <View style={[styles.statusChip, profile?.isAvailable ? styles.chipGreen : styles.chipMuted]}>
              <View style={[styles.dot, { backgroundColor: profile?.isAvailable ? GREEN : MUTED }]} />
              <Text style={styles.chipText}>
                {profile?.isAvailable ? "Available Now" : "Unavailable"}
              </Text>
            </View>
            {activeShiftCount > 0 && (
              <View style={[styles.statusChip, styles.chipAccent]}>
                <Ionicons name="briefcase" size={12} color={ACCENT} />
                <Text style={[styles.chipText, { color: ACCENT }]}>
                  {activeShiftCount} Active Shift{activeShiftCount !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>This Week</Text>
            <Text style={styles.kpiValue}>
              ${thisWeekEarnings > 0 ? thisWeekEarnings.toFixed(0) : "0"}
            </Text>
            <Text style={styles.kpiSub}>earnings</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Rating</Text>
            <Text style={styles.kpiValue}>{(profile?.rating ?? 0).toFixed(1)}</Text>
            <View style={styles.starsRow}>{renderStars(profile?.rating ?? 0)}</View>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Shifts Done</Text>
            <Text style={styles.kpiValue}>{profile?.shiftsCount ?? 0}</Text>
            <Text style={styles.kpiSub}>completed</Text>
          </View>
        </View>

        {/* Upcoming Shift */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Shift</Text>
          {nextShift ? (
            <View style={styles.shiftCard}>
              <View style={styles.shiftHeader}>
                <View style={styles.shiftIcon}>
                  <Ionicons name="briefcase" size={20} color={ACCENT} />
                </View>
                <View style={styles.shiftMeta}>
                  <Text style={styles.shiftJobTitle}>{nextShift.job.title}</Text>
                  <Text style={styles.shiftCompany}>{nextShift.job.client.name}</Text>
                </View>
              </View>
              <View style={styles.shiftDetails}>
                <View style={styles.shiftDetailItem}>
                  <Ionicons name="calendar-outline" size={14} color={MUTED} />
                  <Text style={styles.shiftDetailText}>{formatDay(nextShift.date)}</Text>
                </View>
                <View style={styles.shiftDetailItem}>
                  <Ionicons name="time-outline" size={14} color={MUTED} />
                  <Text style={styles.shiftDetailText}>
                    {nextShift.startTime} – {nextShift.endTime}
                  </Text>
                </View>
                <View style={styles.shiftDetailItem}>
                  <Ionicons name="location-outline" size={14} color={MUTED} />
                  <Text style={styles.shiftDetailText}>{nextShift.job.location}</Text>
                </View>
                <View style={styles.shiftDetailItem}>
                  <Ionicons name="cash-outline" size={14} color={MUTED} />
                  <Text style={styles.shiftDetailText}>${nextShift.job.payRate.toFixed(2)}/hr</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.clockInBtn}
                activeOpacity={0.8}
                onPress={() => router.push(`/shift/${nextShift.id}` as never)}
              >
                <Ionicons name="qr-code-outline" size={18} color="#FFF" />
                <Text style={styles.clockInText}>Clock In with QR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={BORDER} />
              <Text style={styles.emptyText}>No upcoming shifts</Text>
              <Text style={styles.emptySub}>Browse jobs and apply to get scheduled.</Text>
            </View>
          )}
        </View>

        {/* Jobs For You */}
        <View style={[styles.section, { paddingBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jobs For You</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/jobs" as never)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {jobs.length > 0 ? (
            <View style={styles.jobsGrid}>
              {jobs.map((job) => {
                const slotsLeft = job.slotsTotal - job.slotsFilled;
                const initial = job.client.name.charAt(0).toUpperCase();
                return (
                  <View key={job.id} style={styles.miniJobCard}>
                    <View style={styles.miniJobTop}>
                      <View style={styles.miniJobIcon}>
                        <Text style={styles.miniJobInitial}>{initial}</Text>
                      </View>
                      <View style={styles.miniJobMeta}>
                        <Text style={styles.miniJobTitle} numberOfLines={1}>
                          {job.title}
                        </Text>
                        <Text style={styles.miniJobCompany}>{job.client.name}</Text>
                      </View>
                    </View>
                    <View style={styles.miniJobTags}>
                      <View style={styles.miniTag}>
                        <Text style={styles.miniTagText}>{job.category}</Text>
                      </View>
                      <View style={styles.miniTag}>
                        <Text style={styles.miniTagText}>{job.location}</Text>
                      </View>
                    </View>
                    <View style={styles.miniJobBottom}>
                      <Text style={styles.miniJobPay}>${job.payRate.toFixed(2)}/hr</Text>
                      <Text style={styles.miniJobSlots}>{slotsLeft} slots</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="briefcase-outline" size={32} color={BORDER} />
              <Text style={styles.emptyText}>No jobs available right now</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  centered: { alignItems: "center", justifyContent: "center" },

  /* Greeting band */
  greetingBand: {
    backgroundColor: INK,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greetingTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greetingLabel: { fontSize: 14, color: MUTED },
  greetingName: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", marginTop: 2 },
  bellButton: { padding: 6, position: "relative" },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: ACCENT,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  chipRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chipGreen: { backgroundColor: "rgba(74,222,128,0.12)" },
  chipMuted: { backgroundColor: "rgba(139,133,128,0.15)" },
  chipAccent: { backgroundColor: "rgba(232,90,42,0.10)" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: "600", color: GREEN },

  /* KPIs */
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: -1,
    paddingTop: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  kpiLabel: { fontSize: 11, fontWeight: "600", color: MUTED, textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValue: { fontSize: 24, fontWeight: "700", color: INK, marginTop: 6 },
  kpiSub: { fontSize: 11, color: MUTED, marginTop: 2 },
  starsRow: { flexDirection: "row", gap: 2, marginTop: 4 },

  /* Section */
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: INK },
  seeAll: { fontSize: 14, fontWeight: "600", color: ACCENT },

  /* Upcoming Shift Card */
  shiftCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  shiftHeader: { flexDirection: "row", alignItems: "center" },
  shiftIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(232,90,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  shiftMeta: { flex: 1 },
  shiftJobTitle: { fontSize: 16, fontWeight: "700", color: INK },
  shiftCompany: { fontSize: 13, color: MUTED, marginTop: 2 },
  shiftDetails: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 10,
  },
  shiftDetailItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  shiftDetailText: { fontSize: 14, color: INK },
  clockInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  clockInText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  /* Empty */
  emptyCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 32,
    marginTop: 12,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  emptyText: { fontSize: 15, fontWeight: "600", color: INK, marginTop: 12 },
  emptySub: { fontSize: 13, color: MUTED, marginTop: 4, textAlign: "center" },

  /* Mini Job Cards */
  jobsGrid: { gap: 10, marginTop: 12 },
  miniJobCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  miniJobTop: { flexDirection: "row", alignItems: "center" },
  miniJobIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F0EDE8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  miniJobInitial: { fontSize: 16, fontWeight: "700", color: INK },
  miniJobMeta: { flex: 1 },
  miniJobTitle: { fontSize: 15, fontWeight: "700", color: INK },
  miniJobCompany: { fontSize: 12, color: MUTED, marginTop: 1 },
  miniJobTags: { flexDirection: "row", gap: 6, marginTop: 10 },
  miniTag: { backgroundColor: "#F8F6F2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  miniTagText: { fontSize: 11, color: MUTED, fontWeight: "500" },
  miniJobBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  miniJobPay: { fontSize: 16, fontWeight: "700", color: INK },
  miniJobSlots: { fontSize: 12, fontWeight: "600", color: ACCENT },
});
