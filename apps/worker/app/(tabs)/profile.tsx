import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-context";

const INK = "#0D0D0D";
const PAPER = "#F5F2EC";
const CREAM = "#EDE9DF";
const ACCENT = "#E85A2A";
const ACCENT2 = "#2A7AE8";
const MUTED = "#8B8580";
const GOLD = "#C8A84B";
const GREEN = "#4ADE80";
const CARD = "#FFFFFF";
const BORDER = "rgba(13,13,13,0.10)";

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={[styles.star, { color: i <= full ? GOLD : i === full + 1 && half ? GOLD : BORDER }]}>
          {i <= full ? "★" : i === full + 1 && half ? "⯨" : "★"}
        </Text>
      ))}
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

interface MenuItem {
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}

function MenuRow({ label, sublabel, onPress, danger }: MenuItem) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuRowContent}>
        <Text style={[styles.menuLabel, danger && { color: "#EF4444" }]}>{label}</Text>
        {sublabel ? <Text style={styles.menuSublabel}>{sublabel}</Text> : null}
      </View>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const profile = user?.profile;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const verifiedSkills = profile?.skills?.filter((s) => s.verified) ?? [];
  const otherSkills = profile?.skills?.filter((s) => !s.verified) ?? [];

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          await signOut();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>{user?.name ?? "—"}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Freelance Contractor</Text>
          </View>
          {profile?.rating ? <StarRating rating={profile.rating} /> : null}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>
              {profile?.verificationStatus === "VERIFIED" ? "✓ Verified" : profile?.verificationStatus ?? "Unverified"}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.shiftsCount ?? 0}</Text>
            <Text style={styles.statLabel}>Shifts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              ${(profile?.totalEarned ?? 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.showRate ?? 100}%</Text>
            <Text style={styles.statLabel}>Show Rate</Text>
          </View>
        </View>

        {/* Verified Skills */}
        {verifiedSkills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verified Skills</Text>
            <View style={styles.skillsWrap}>
              {verifiedSkills.map((s) => (
                <View key={s.skill.name} style={styles.skillBadgeVerified}>
                  <Text style={styles.skillCheckmark}>✓</Text>
                  <Text style={styles.skillBadgeText}>{s.skill.name}</Text>
                </View>
              ))}
              {otherSkills.map((s) => (
                <View key={s.skill.name} style={styles.skillBadge}>
                  <Text style={styles.skillBadgeText}>{s.skill.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Account Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuRow
              label="My Documents"
              sublabel="NRIC, certifications"
              onPress={() => Alert.alert("Coming soon")}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              label="Bank Account"
              sublabel="Payout details"
              onPress={() => Alert.alert("Coming soon")}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              label="Notifications"
              onPress={() => router.push("/notifications" as never)}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              label="Help & Support"
              onPress={() => Alert.alert("Coming soon")}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              label="Settings"
              onPress={() => Alert.alert("Coming soon")}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={styles.menuCard}>
            <MenuRow
              label={signingOut ? "Signing out…" : "Sign Out"}
              onPress={handleSignOut}
              danger
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },

  // Hero
  hero: {
    backgroundColor: INK,
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: CARD, fontSize: 28, fontWeight: "700" },
  heroName: { color: CARD, fontSize: 22, fontWeight: "700", marginBottom: 6 },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  roleBadgeText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  stars: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 8 },
  star: { fontSize: 16 },
  ratingText: { color: GOLD, fontSize: 13, fontWeight: "600", marginLeft: 4 },
  verifiedBadge: {
    backgroundColor: "rgba(74,222,128,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  verifiedText: { color: GREEN, fontSize: 12, fontWeight: "600" },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: INK },
  statLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: BORDER },

  // Sections
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  // Skills
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillBadgeVerified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(74,222,128,0.12)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.3)",
  },
  skillCheckmark: { color: GREEN, fontSize: 12, fontWeight: "700" },
  skillBadge: {
    backgroundColor: CREAM,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  skillBadgeText: { fontSize: 13, color: INK, fontWeight: "500" },

  // Menu
  menuCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowContent: { flex: 1 },
  menuLabel: { fontSize: 15, color: INK, fontWeight: "500" },
  menuSublabel: { fontSize: 12, color: MUTED, marginTop: 1 },
  menuChevron: { fontSize: 20, color: MUTED, marginLeft: 8 },
  menuDivider: { height: 1, backgroundColor: BORDER, marginLeft: 16 },
});
