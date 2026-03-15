import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPatch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const INK = "#0D0D0D";
const PAPER = "#F5F2EC";
const CREAM = "#EDE9DF";
const ACCENT = "#E85A2A";
const ACCENT2 = "#2A7AE8";
const MUTED = "#8B8580";
const CARD = "#FFFFFF";
const BORDER = "rgba(13,13,13,0.10)";
const GREEN = "#4ADE80";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  APPLICATION_ACCEPTED: { name: "checkmark-circle", color: GREEN },
  APPLICATION_REJECTED: { name: "close-circle", color: "#EF4444" },
  SHIFT_ASSIGNED: { name: "calendar", color: ACCENT2 },
  TIMESHEET_APPROVED: { name: "checkmark-done-circle", color: GREEN },
  TIMESHEET_FLAGGED: { name: "flag", color: "#F59E0B" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const { data } = await apiGet<Notification[]>("/notifications");
    setNotifications(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("notifications-screen")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Notification", filter: `userId=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => [n, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  async function markAllRead() {
    await apiPatch("/notifications");
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={48} color={MUTED} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const iconInfo = TYPE_ICONS[item.type] ?? { name: "notifications-outline" as keyof typeof Ionicons.glyphMap, color: MUTED };
            return (
              <View style={[styles.notifRow, !item.read && styles.notifUnread]}>
                <View style={[styles.iconWrap, { backgroundColor: `${iconInfo.color}18` }]}>
                  <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifTopRow}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifBody}>{item.body}</Text>
                  <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: MUTED, fontSize: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD,
  },
  backBtn: { marginRight: 12, padding: 2 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: INK },
  markAllText: { fontSize: 13, color: ACCENT2, fontWeight: "600" },

  list: { paddingVertical: 8 },
  separator: { height: 1, backgroundColor: BORDER, marginLeft: 72 },

  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: CARD,
  },
  notifUnread: { backgroundColor: `${ACCENT2}08` },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notifContent: { flex: 1 },
  notifTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notifTitle: { fontSize: 14, fontWeight: "600", color: INK, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT2, marginLeft: 8 },
  notifBody: { fontSize: 13, color: MUTED, marginTop: 3, lineHeight: 18 },
  notifTime: { fontSize: 11, color: MUTED, marginTop: 4 },
});
