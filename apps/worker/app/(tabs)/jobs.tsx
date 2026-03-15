import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "../../lib/api";

const { width: SCREEN_W } = Dimensions.get("window");

const INK = "#0D0D0D";
const PAPER = "#F5F2EC";
const ACCENT = "#E85A2A";
const MUTED = "#8B8580";
const CARD = "#FFFFFF";
const BORDER = "rgba(13,13,13,0.10)";
const GREEN = "#4ADE80";

const CATEGORIES = ["All", "Logistics", "Retail", "Events", "Delivery", "Saved"];

const CATEGORY_ICONS: Record<string, string> = {
  All: "apps",
  Logistics: "cube",
  Retail: "cart",
  Events: "calendar",
  Delivery: "bicycle",
  Saved: "heart",
};

interface Job {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location: string;
  payRate: number;
  slotsTotal: number;
  slotsFilled: number;
  status: string;
  startDate: string;
  client: { id: string; name: string; industry: string };
  shiftCount: number;
  nextShift: { date: string; startTime: string; endTime: string } | null;
}

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useState(new Animated.Value(0))[0];

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory !== "All" && activeCategory !== "Saved") {
      params.set("category", activeCategory);
    }
    if (search.trim()) {
      params.set("search", search.trim());
    }
    const qs = params.toString();
    const { data } = await apiGet<Job[]>(`/jobs${qs ? `?${qs}` : ""}`);
    setJobs(data ?? []);
    setLoading(false);
  }, [activeCategory, search]);

  useEffect(() => {
    if (activeCategory === "Saved") return;
    fetchJobs();
  }, [fetchJobs, activeCategory]);

  const showToast = (message: string) => {
    setToast(message);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    const { error } = await apiPost("/applications", { jobId });
    setApplyingId(null);
    if (error) {
      showToast(error);
    } else {
      setAppliedJobs((prev) => new Set(prev).add(jobId));
      showToast("Applied! We're on it. 🚀");
    }
  };

  const toggleSave = (jobId: string) => {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  const displayJobs =
    activeCategory === "Saved" ? jobs.filter((j) => savedJobs.has(j.id)) : jobs;

  const renderChip = (cat: string) => {
    const active = activeCategory === cat;
    return (
      <TouchableOpacity
        key={cat}
        style={[styles.chip, active && styles.chipActive]}
        onPress={() => setActiveCategory(cat)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={(CATEGORY_ICONS[cat] ?? "ellipse") as keyof typeof Ionicons.glyphMap}
          size={14}
          color={active ? "#FFFFFF" : MUTED}
          style={{ marginRight: 5 }}
        />
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
      </TouchableOpacity>
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  };

  const renderJob = ({ item }: { item: Job }) => {
    const saved = savedJobs.has(item.id);
    const applied = appliedJobs.has(item.id);
    const applying = applyingId === item.id;
    const slotsLeft = item.slotsTotal - item.slotsFilled;
    const initial = item.client.name.charAt(0).toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.companyIcon}>
            <Text style={styles.companyInitial}>{initial}</Text>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.titleRow}>
              <Text style={styles.jobTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.slotsText}>× {slotsLeft} slots</Text>
            </View>
            <Text style={styles.companyName}>{item.client.name}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleSave(item.id)} hitSlop={12}>
            <Ionicons
              name={saved ? "heart" : "heart-outline"}
              size={22}
              color={saved ? ACCENT : MUTED}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Ionicons name="location-outline" size={12} color={MUTED} />
            <Text style={styles.tagText}>{item.location}</Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="pricetag-outline" size={12} color={MUTED} />
            <Text style={styles.tagText}>{item.category}</Text>
          </View>
          {item.nextShift && (
            <View style={styles.tag}>
              <Ionicons name="time-outline" size={12} color={MUTED} />
              <Text style={styles.tagText}>
                {formatDate(item.nextShift.date)} · {item.nextShift.startTime}
              </Text>
            </View>
          )}
          {item.shiftCount > 1 && (
            <View style={styles.tag}>
              <Ionicons name="layers-outline" size={12} color={MUTED} />
              <Text style={styles.tagText}>{item.shiftCount} shifts</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.payRate}>${item.payRate.toFixed(2)}/hr</Text>
          </View>
          {applied ? (
            <View style={styles.appliedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={GREEN} />
              <Text style={styles.appliedText}>Applied</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => handleApply(item.id)}
              disabled={applying}
              activeOpacity={0.8}
            >
              {applying ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.applyBtnText}>Apply Now</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Browse Jobs</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={MUTED} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, companies..."
            placeholderTextColor={MUTED}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchJobs}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(""); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={MUTED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.chipRow}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
          keyExtractor={(c) => c}
          renderItem={({ item }) => renderChip(item)}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : displayJobs.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color={BORDER} />
          <Text style={styles.emptyTitle}>
            {activeCategory === "Saved" ? "No saved jobs yet" : "No jobs found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeCategory === "Saved"
              ? "Tap the heart icon on a job to save it here."
              : "Try a different search or category."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayJobs}
          keyExtractor={(j) => j.id}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {toast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  heading: { fontSize: 28, fontWeight: "700", color: INK, fontFamily: "System" },

  searchRow: { paddingHorizontal: 20, paddingTop: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: { flex: 1, fontSize: 15, color: INK, marginLeft: 10 },

  chipRow: { paddingTop: 14 },
  chipList: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { fontSize: 13, fontWeight: "600", color: MUTED },
  chipTextActive: { color: "#FFFFFF" },

  list: { padding: 20, paddingTop: 14, gap: 14, paddingBottom: 40 },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start" },
  companyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F0EDE8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  companyInitial: { fontSize: 18, fontWeight: "700", color: INK },
  cardMeta: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  jobTitle: { fontSize: 16, fontWeight: "700", color: INK, flexShrink: 1 },
  slotsText: {
    fontSize: 12,
    fontWeight: "600",
    color: ACCENT,
    backgroundColor: "rgba(232,90,42,0.08)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  companyName: { fontSize: 13, color: MUTED, marginTop: 2 },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8F6F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: { fontSize: 12, color: MUTED },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  payRate: { fontSize: 18, fontWeight: "700", color: INK, fontFamily: "System" },

  applyBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 110,
    alignItems: "center",
  },
  applyBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  appliedBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  appliedText: { fontSize: 14, fontWeight: "600", color: GREEN },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: INK, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: MUTED, marginTop: 6, textAlign: "center" },

  toast: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: INK,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});
