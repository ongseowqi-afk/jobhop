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
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/lib/colors";

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleVerify() {
    if (otp.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone!,
      token: otp,
      type: "sms",
    });

    if (error) {
      Alert.alert("Verification Failed", error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  async function handleResend() {
    const { error } = await supabase.auth.signInWithOtp({ phone: phone! });
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Sent", "A new verification code has been sent.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Enter verification code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to {phone}
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="000000"
          placeholderTextColor={Colors.muted}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          autoFocus
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.length < 6}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} style={styles.resend}>
          <Text style={styles.resendText}>Didn't receive a code? Resend</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: "700", color: Colors.ink },
  subtitle: { fontSize: 15, color: Colors.muted, marginTop: 6 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: "700",
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.border,
    letterSpacing: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  resend: { alignItems: "center", marginTop: 20, padding: 8 },
  resendText: { color: Colors.accent2, fontSize: 14, fontWeight: "600" },
});
