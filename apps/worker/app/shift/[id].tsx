import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { apiGet, apiPost } from "../../lib/api";

const INK = "#0D0D0D";
const PAPER = "#F5F2EC";
const ACCENT = "#E85A2A";
const GREEN = "#4ADE80";
const MUTED = "#8B8580";
const CARD = "#FFFFFF";
const BORDER = "rgba(13,13,13,0.10)";

interface ShiftDetail {
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

type ShiftState = "loading" | "ready" | "scanning" | "clocked_in" | "clocked_out";

export default function ShiftScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [state, setState] = useState<ShiftState>("loading");
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [totalHours, setTotalHours] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanLockRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchShift();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (state === "clocked_in") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [state]);

  const fetchShift = async () => {
    const { data } = await apiGet<ShiftDetail[]>(`/shifts?upcoming=true`);
    const found = (data ?? []).find((s) => s.id === id);
    if (found) {
      setShift(found);
      if (found.assignmentStatus === "CLOCKED_IN") {
        setState("clocked_in");
        setClockInTime(new Date());
        startTimer();
      } else if (found.assignmentStatus === "CLOCKED_OUT") {
        setState("clocked_out");
      } else {
        setState("ready");
      }
    } else {
      setState("ready");
    }
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
  };

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });

  const handleScan = async (data: string) => {
    if (scanLockRef.current || processing) return;
    scanLockRef.current = true;
    setProcessing(true);

    try {
      const parsed = JSON.parse(data);
      if (parsed.shiftId !== id) {
        Alert.alert("Wrong Shift", "This QR code is for a different shift.");
        scanLockRef.current = false;
        setProcessing(false);
        return;
      }

      const { data: result, error } = await apiPost<{ timesheetId: string; clockIn: string; warning?: string | null }>(
        `/shifts/${id}/clock-in`,
        { token: parsed.token }
      );

      if (error) {
        Alert.alert("Clock-In Failed", error);
        scanLockRef.current = false;
        setProcessing(false);
        return;
      }

      setClockInTime(new Date(result!.clockIn));
      if (result!.warning) setWarning(result!.warning);
      setState("clocked_in");
      startTimer();
    } catch {
      Alert.alert("Invalid QR", "Could not read this QR code.");
    }
    setProcessing(false);
  };

  const handleClockOut = async () => {
    Alert.alert("Clock Out", "Are you sure you want to clock out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clock Out",
        style: "destructive",
        onPress: async () => {
          setProcessing(true);
          const { data, error } = await apiPost<{ totalHours: number }>(
            `/shifts/${id}/clock-out`
          );
          setProcessing(false);
          if (error) {
            Alert.alert("Error", error);
            return;
          }
          if (timerRef.current) clearInterval(timerRef.current);
          setTotalHours(data!.totalHours);
          setState("clocked_out");
        },
      },
    ]);
  };

  if (state === "loading") {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={INK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shift Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Shift Info */}
      {shift && (
        <View style={styles.shiftInfo}>
          <View style={styles.shiftIconBox}>
            <Ionicons name="briefcase" size={24} color={ACCENT} />
          </View>
          <Text style={styles.shiftTitle}>{shift.job.title}</Text>
          <Text style={styles.shiftCompany}>{shift.job.client.name}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={MUTED} />
            <Text style={styles.detailText}>{formatDate(shift.date)}</Text>
            <Ionicons name="time-outline" size={14} color={MUTED} style={{ marginLeft: 12 }} />
            <Text style={styles.detailText}>{shift.startTime} – {shift.endTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={MUTED} />
            <Text style={styles.detailText}>{shift.job.location}</Text>
          </View>
        </View>
      )}

      {/* States */}
      {state === "ready" && (
        <View style={styles.stateContainer}>
          <View style={styles.statusBadge}>
            <Ionicons name="qr-code-outline" size={20} color={ACCENT} />
            <Text style={styles.statusText}>Ready to Clock In</Text>
          </View>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={async () => {
              if (!permission?.granted) {
                const { granted } = await requestPermission();
                if (!granted) {
                  Alert.alert("Camera Required", "Camera permission is needed to scan the QR code.");
                  return;
                }
              }
              setState("scanning");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={22} color="#FFF" />
            <Text style={styles.scanBtnText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === "scanning" && (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => handleScan(data)}
          >
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanHint}>Point at the shift QR code</Text>
            </View>
          </CameraView>
          {processing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.processingText}>Verifying...</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.cancelScanBtn}
            onPress={() => {
              setState("ready");
              scanLockRef.current = false;
            }}
          >
            <Text style={styles.cancelScanText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === "clocked_in" && (
        <View style={styles.stateContainer}>
          <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="checkmark-circle" size={28} color={GREEN} />
            <Text style={styles.timerLabel}>Clocked In</Text>
            <Text style={styles.timerValue}>{formatElapsed(elapsed)}</Text>
          </Animated.View>

          {warning && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#D97706" />
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          )}

          {clockInTime && (
            <Text style={styles.clockedAtText}>
              Started at {clockInTime.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          )}

          <TouchableOpacity
            style={styles.clockOutBtn}
            onPress={handleClockOut}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#FFF" />
                <Text style={styles.clockOutText}>Clock Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {state === "clocked_out" && (
        <View style={styles.stateContainer}>
          <View style={styles.doneCircle}>
            <Ionicons name="checkmark-done-circle" size={48} color={GREEN} />
          </View>
          <Text style={styles.doneTitle}>Shift Complete</Text>
          {totalHours != null && (
            <Text style={styles.doneHours}>{totalHours.toFixed(2)} hours logged</Text>
          )}
          <Text style={styles.doneSub}>Your timesheet has been submitted for approval.</Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAPER },
  centered: { alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: INK },

  shiftInfo: {
    backgroundColor: CARD,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  shiftIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(232,90,42,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  shiftTitle: { fontSize: 18, fontWeight: "700", color: INK, textAlign: "center" },
  shiftCompany: { fontSize: 14, color: MUTED, marginTop: 4 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  detailText: { fontSize: 13, color: INK },

  stateContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(232,90,42,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 32,
  },
  statusText: { fontSize: 14, fontWeight: "600", color: ACCENT },

  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
  },
  scanBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  scannerContainer: { flex: 1, marginTop: 16 },
  camera: { flex: 1 },
  scanOverlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: "#FFF",
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  scanHint: { color: "#FFF", fontSize: 14, fontWeight: "600", marginTop: 20 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: { color: "#FFF", fontSize: 14, fontWeight: "600", marginTop: 12 },
  cancelScanBtn: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  cancelScanText: { color: "#FFF", fontSize: 14, fontWeight: "600" },

  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: GREEN,
    marginBottom: 24,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  timerLabel: { fontSize: 13, fontWeight: "600", color: GREEN, marginTop: 6 },
  timerValue: { fontSize: 32, fontWeight: "700", color: INK, marginTop: 4, fontVariant: ["tabular-nums"] },

  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  warningText: { fontSize: 12, color: "#92400E", flex: 1 },

  clockedAtText: { fontSize: 13, color: MUTED, marginBottom: 32 },

  clockOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: INK,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
  },
  clockOutText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  doneCircle: { marginBottom: 20 },
  doneTitle: { fontSize: 22, fontWeight: "700", color: INK },
  doneHours: { fontSize: 16, fontWeight: "600", color: GREEN, marginTop: 8 },
  doneSub: { fontSize: 14, color: MUTED, marginTop: 8, textAlign: "center" },
  doneBtn: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    marginTop: 32,
  },
  doneBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
