import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/colors";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AgreementScreen() {
  const { name, residency, documents } = useLocalSearchParams<{
    name: string;
    residency: string;
    documents: string;
  }>();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshProfile } = useAuth();

  async function handleAccept() {
    if (!accepted) return;
    setLoading(true);

    const parsedDocs = JSON.parse(documents || "[]");

    const { error: onboardError } = await apiPost("/workers/onboarding", {
      name,
      residencyStatus: residency,
      documents: parsedDocs,
      isStudentPass: residency === "STUDENT_PASS",
    });

    if (onboardError) {
      Alert.alert("Error", onboardError);
      setLoading(false);
      return;
    }

    const { error: agreeError } = await apiPost("/workers/contractor-agreement");

    if (agreeError) {
      Alert.alert("Error", agreeError);
      setLoading(false);
      return;
    }

    await refreshProfile();
    setLoading(false);
    router.replace("/(onboarding)/confirmation");
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.step}>Step 4 of 4</Text>
        <Text style={styles.title}>Freelance Contractor Agreement</Text>

        <View style={styles.agreementBox}>
          <Text style={styles.agreementText}>
            By accepting this agreement, I confirm and acknowledge that:
          </Text>
          <View style={styles.clause}>
            <Ionicons name="document-text-outline" size={18} color={Colors.accent} />
            <Text style={styles.clauseText}>
              I am an <Text style={styles.bold}>independent contractor</Text> and not an employee of JobHop or any client.
            </Text>
          </View>
          <View style={styles.clause}>
            <Ionicons name="cash-outline" size={18} color={Colors.accent} />
            <Text style={styles.clauseText}>
              There is <Text style={styles.bold}>no employment relationship</Text>, no CPF contributions, and no employment benefits.
            </Text>
          </View>
          <View style={styles.clause}>
            <Ionicons name="receipt-outline" size={18} color={Colors.accent} />
            <Text style={styles.clauseText}>
              I am <Text style={styles.bold}>responsible for my own IRAS tax filings</Text> and compliance with Singapore tax regulations.
            </Text>
          </View>
          <View style={styles.clause}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.accent} />
            <Text style={styles.clauseText}>
              I confirm that my residency status and documents are accurate and I am legally eligible to perform freelance work in Singapore.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkBox, accepted && styles.checkBoxActive]}>
            {accepted && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkLabel}>
            I confirm I am an independent contractor. I understand there is no
            employment relationship, no CPF contributions, and I am responsible
            for my own IRAS tax filings.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!accepted || loading) && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={!accepted || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Submitting..." : "Accept & Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  step: { fontSize: 13, fontWeight: "600", color: Colors.accent, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", color: Colors.ink, marginBottom: 24 },
  agreementBox: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  agreementText: { fontSize: 15, color: Colors.ink, lineHeight: 22, marginBottom: 16 },
  clause: { flexDirection: "row", marginBottom: 14, gap: 12, alignItems: "flex-start" },
  clauseText: { flex: 1, fontSize: 14, color: Colors.ink, lineHeight: 20 },
  bold: { fontWeight: "700" },
  checkbox: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingRight: 8 },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkBoxActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkLabel: { flex: 1, fontSize: 14, color: Colors.muted, lineHeight: 20 },
  footer: { paddingHorizontal: 24, paddingBottom: 24 },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
