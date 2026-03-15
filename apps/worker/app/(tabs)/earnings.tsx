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
import { apiGet } from "../../lib/api";

const INK = "#0D0D0D";
const PAPER = "#F5F2EC";
const ACCENT = "#E85A2A";
const GREEN = "#4ADE80";
const MUTED = "#8B8580";
const CARD = "#FFFFFF";
const BORDER = "rgba(13,13,13,0.10)";

interface Payslip {
  id: string;
  weekLabel: string;
  grossAmount: number;
  bonus: number;
  netAmount: number;
  status: string;
  shiftsEstimate: number;
  hoursEstimate: number;
}

interface EarningsData {
  totalEarned: number;
  periodLabel: string;
  shiftsCompleted: number;
  breakdown: { gross: number; bonus: number; net: number };
  payslips: Payslip[];
}

type Period = "month" | "3months" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  month: "This Month",
  "3months": "3 Months",
  all: "All Time",
};

export default function EarningsScreen() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("month");

  const fetchEarnings = useCallback(async () => {
    const { data: res } = await apiGet<EarningsData>(
      `/workers/me/earnings?period=${period}`
    );
    setData(res ?? null);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchEarnings();
  }, [fetchEarnings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEarnings();
    setRefreshing(false);
  }, [fetchEarnings]);

  const formatCurrency = (amount: number) => {
    const parts = amount.toFixed(2).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `$${intPart}`;
  };

  const formatCents = (amount: number) => {
    return `.${amount.toFixed(2).split(".")[1]}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </SafeAreaView>
    );
  }

  const totalDisplay = data?.totalEarned ?? 0;
  const breakdown = data?.breakdown ?? { gross: 0, bonus: 0, net: 0 };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        {/* Dark Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Total Earned</Text>
          <View style={styles.heroAmountRow}>
            <Text style={styles.heroAmount}>{formatCurrency(totalDisplay)}</Text>
            <Text style={styles.heroCents}>{formatCents(totalDisplay)}</Text>
          </View>
          <Text style={styles.heroPeriod}>
            {data?.periodLabel ?? "—"} · {data?.shiftsCompleted ?? 0} shifts completed
          </Text>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            {(["month", "3months", "all"] as Period[]).map((p) => {
              const active = period === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setPeriod(p)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {PERIOD_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Breakdown Card */}
        <View style={styles.section}>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Base Earnings</Text>
              <Text style={styles.breakdownValue}>${breakdown.gross.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Bonuses</Text>
              <Text style={[styles.breakdownValue, styles.bonusText]}>
                +${breakdown.bonus.toFixed(2)}
              </Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.netLabel}>Net Payout</Text>
              <Text style={styles.netValue}>${breakdown.net.toFixed(2)}</Text>
            </View>

            <View style={styles.noCpfBanner}>
              <Ionicons name="information-circle-outline" size={14} color={MUTED} />
              <Text style={styles.noCpfText}>
                No CPF deductions — freelance independent contractor
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Payslips */}
        <View style={[styles.section, { paddingBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Recent Payslips</Text>

          {(data?.payslips ?? []).length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={36} color={BORDER} />
              <Text style={styles.emptyTitle}>No payslips yet</Text>
              <Text style={styles.emptySub}>
                Complete shifts to start earning.
              </Text>
            </View>
          ) : (
            <View style={styles.payslipList}>
              {data!.payslips.map((ps) => (
                <View key={ps.id} style={styles.payslipCard}>
                  <View style={styles.payslipLeft}>
                    <View style={styles.walletIcon}>
                      <Ionicons name="wallet" size={18} color={ACCENT} />
                    </View>
                    <View>
                      <Text style={styles.payslipWeek}>{ps.weekLabel}</Text>
                      <Text style={styles.payslipSub}>
                        {ps.shiftsEstimate} shifts · {ps.hoursEstimate} hrs
                      </Text>
                    </View>
                  </View>
                  <View style={styles.payslipRight}>
                    <Text style={styles.payslipAmount}>${ps.netAmount.toFixed(0)}</Text>
                    <View
                      style={[
                        styles.payslipBadge,
                        ps.status === "PAID" ? styles.paidBadge : styles.pendingBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.payslipBadgeText,
                          ps.status === "PAID"
                            ? styles.paidBadgeText
                            : styles.pendingBadgeText,
                        ]}
                      >
                        {ps.status === "PAID" ? "Paid" : "Pending"}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
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

  /* Hero */
  hero: {
    backgroundColor: INK,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroAmountRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 8 },
  heroAmount: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 56,
  },
  heroCents: {
    fontSize: 22,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },
  heroPeriod: {
    fontSize: 13,
    color: MUTED,
    marginTop: 8,
  },

  /* Tabs */
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 3,
    marginTop: 20,
    gap: 2,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },

  /* Section */
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: INK, marginBottom: 12 },

  /* Breakdown */
  breakdownCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  breakdownLabel: { fontSize: 15, color: INK },
  breakdownValue: { fontSize: 15, fontWeight: "600", color: INK },
  bonusText: { color: GREEN },
  breakdownDivider: { height: 1, backgroundColor: BORDER },
  netLabel: { fontSize: 16, fontWeight: "700", color: INK },
  netValue: { fontSize: 20, fontWeight: "700", color: ACCENT },
  noCpfBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  noCpfText: { fontSize: 12, color: MUTED, flex: 1 },

  /* Payslips */
  payslipList: { gap: 10 },
  payslipCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  payslipLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "rgba(232,90,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  payslipWeek: { fontSize: 14, fontWeight: "600", color: INK },
  payslipSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  payslipRight: { alignItems: "flex-end" },
  payslipAmount: { fontSize: 18, fontWeight: "700", color: INK },
  payslipBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadge: { backgroundColor: "rgba(74,222,128,0.10)" },
  pendingBadge: { backgroundColor: "rgba(232,90,42,0.08)" },
  payslipBadgeText: { fontSize: 11, fontWeight: "700" },
  paidBadgeText: { color: GREEN },
  pendingBadgeText: { color: ACCENT },

  /* Empty */
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
});
