import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/colors";

export default function ConfirmationScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.green} />
        </View>

        <Text style={styles.title}>You're all set!</Text>

        <Text style={styles.message}>
          Your documents are under review. You'll be notified once verified.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={20} color={Colors.accent2} />
          <Text style={styles.infoText}>
            Verification usually takes less than 24 hours. We'll send you a
            notification when your account is approved.
          </Text>
        </View>
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
    fontSize: 28,
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
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: { flex: 1, fontSize: 14, color: Colors.ink, lineHeight: 20 },
});
