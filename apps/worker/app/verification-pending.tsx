import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/colors";
import { useAuth } from "@/lib/auth-context";

export default function VerificationPendingScreen() {
  const { refreshProfile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  async function handleRefresh() {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="hourglass-outline" size={64} color={Colors.gold} />
        </View>

        <Text style={styles.title}>Verification in Progress</Text>

        <Text style={styles.message}>
          Our team is reviewing your documents. This usually takes less than 24
          hours.
        </Text>

        <Text style={styles.subMessage}>
          You'll be able to browse and apply for jobs once your identity is
          verified.
        </Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={checking}
          activeOpacity={0.8}
        >
          {checking ? (
            <ActivityIndicator color={Colors.card} size="small" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.refreshText}>Check Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: { marginBottom: 24 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.ink,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  refreshButton: {
    flexDirection: "row",
    backgroundColor: Colors.accent2,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 8,
  },
  refreshText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  signOutBtn: { marginTop: 20, padding: 8 },
  signOutText: { color: Colors.muted, fontSize: 14 },
});
