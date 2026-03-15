import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/lib/colors";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSendOtp() {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length !== 8) {
      Alert.alert("Invalid Number", "Please enter a valid 8-digit Singapore phone number.");
      return;
    }

    setLoading(true);
    const fullPhone = `+65${cleaned}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });

    if (error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push({ pathname: "/(auth)/otp", params: { phone: fullPhone } });
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>
            Job<Text style={styles.brandDot}>.</Text>Hop
          </Text>
          <Text style={styles.title}>Enter your phone number</Text>
          <Text style={styles.subtitle}>
            We'll send you a verification code via SMS
          </Text>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+65</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="8123 4567"
            placeholderTextColor={Colors.muted}
            keyboardType="phone-pad"
            maxLength={8}
            value={phone}
            onChangeText={setPhone}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading || phone.length < 8}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending..." : "Send OTP"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  header: { marginBottom: 32 },
  brand: { fontSize: 32, fontWeight: "700", color: Colors.ink, marginBottom: 24 },
  brandDot: { color: Colors.accent },
  title: { fontSize: 24, fontWeight: "700", color: Colors.ink },
  subtitle: { fontSize: 15, color: Colors.muted, marginTop: 6 },
  inputRow: { flexDirection: "row", marginBottom: 20 },
  prefix: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    marginRight: 10,
  },
  prefixText: { fontSize: 17, fontWeight: "600", color: Colors.ink },
  input: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: "600",
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.border,
    letterSpacing: 2,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
