import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "@/lib/colors";

export default function NameScreen() {
  const [name, setName] = useState("");
  const router = useRouter();

  function handleContinue() {
    if (name.trim().length < 2) return;
    router.push({
      pathname: "/(onboarding)/residency",
      params: { name: name.trim() },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <View style={styles.content}>
          <Text style={styles.step}>Step 1 of 4</Text>
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.subtitle}>
            This is how clients and recruiters will see you.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={Colors.muted}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, name.trim().length < 2 && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={name.trim().length < 2}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between", paddingBottom: 24 },
  content: { marginTop: 20 },
  step: { fontSize: 13, fontWeight: "600", color: Colors.accent, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", color: Colors.ink },
  subtitle: { fontSize: 15, color: Colors.muted, marginTop: 6, marginBottom: 28 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.border,
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
