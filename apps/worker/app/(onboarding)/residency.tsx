import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/colors";

const RESIDENCY_OPTIONS = [
  {
    value: "CITIZEN",
    label: "Singapore Citizen",
    description: "NRIC starting with S or T",
    icon: "flag-outline" as const,
  },
  {
    value: "PR",
    label: "Permanent Resident",
    description: "NRIC starting with F or G",
    icon: "home-outline" as const,
  },
  {
    value: "STUDENT_PASS",
    label: "Student Pass",
    description: "16 hrs/week during term, LOC required",
    icon: "school-outline" as const,
  },
  {
    value: "DEPENDANT_PASS",
    label: "Dependant Pass",
    description: "Valid LOC from MOM required",
    icon: "people-outline" as const,
  },
];

export default function ResidencyScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  function handleContinue() {
    if (!selected) return;
    router.push({
      pathname: "/(onboarding)/documents",
      params: { name, residency: selected },
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.step}>Step 2 of 4</Text>
        <Text style={styles.title}>Residency Status</Text>
        <Text style={styles.subtitle}>
          Required by MOM for freelance work eligibility verification.
        </Text>

        <View style={styles.options}>
          {RESIDENCY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.option,
                selected === opt.value && styles.optionSelected,
              ]}
              onPress={() => setSelected(opt.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, selected === opt.value && styles.iconWrapSelected]}>
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={selected === opt.value ? Colors.card : Colors.ink}
                />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.description}</Text>
              </View>
              {selected === opt.value && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.paper },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  step: { fontSize: 13, fontWeight: "600", color: Colors.accent, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", color: Colors.ink },
  subtitle: { fontSize: 15, color: Colors.muted, marginTop: 6, marginBottom: 28 },
  options: { gap: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionSelected: { borderColor: Colors.accent },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  iconWrapSelected: { backgroundColor: Colors.accent },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: "600", color: Colors.ink },
  optionDesc: { fontSize: 13, color: Colors.muted, marginTop: 2 },
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
