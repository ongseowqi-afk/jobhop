import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/lib/colors";
import { supabase } from "@/lib/supabase";

interface DocUpload {
  uri: string;
  url: string | null;
  uploading: boolean;
}

export default function DocumentsScreen() {
  const { name, residency } = useLocalSearchParams<{ name: string; residency: string }>();
  const router = useRouter();
  const isStudent = residency === "STUDENT_PASS";
  const isDependant = residency === "DEPENDANT_PASS";

  const [nric, setNric] = useState<DocUpload | null>(null);
  const [studentPass, setStudentPass] = useState<DocUpload | null>(null);
  const [loc, setLoc] = useState<DocUpload | null>(null);

  async function pickImage(setter: (v: DocUpload) => void, docType: string) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setter({ uri: asset.uri, url: null, uploading: true });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = asset.uri.split(".").pop() || "jpg";
      const filePath = `${user.id}/${docType}_${Date.now()}.${ext}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from("worker-documents")
        .upload(filePath, blob, { contentType: `image/${ext}` });

      if (error) {
        console.warn("Upload failed, using local URI:", error.message);
        setter({ uri: asset.uri, url: asset.uri, uploading: false });
        return;
      }

      const { data: urlData } = supabase.storage
        .from("worker-documents")
        .getPublicUrl(data.path);

      setter({ uri: asset.uri, url: urlData.publicUrl, uploading: false });
    } catch {
      setter({ uri: asset.uri, url: asset.uri, uploading: false });
    }
  }

  const canContinue =
    nric?.url &&
    (!isStudent || (studentPass?.url && loc?.url)) &&
    (!isDependant || loc?.url);

  function handleContinue() {
    const docs: Array<{ type: string; url: string }> = [];
    if (nric?.url) docs.push({ type: "NRIC_FRONT", url: nric.url });
    if (studentPass?.url) docs.push({ type: "STUDENT_PASS", url: studentPass.url });
    if (loc?.url) docs.push({ type: "LETTER_OF_CONSENT", url: loc.url });

    router.push({
      pathname: "/(onboarding)/agreement",
      params: {
        name,
        residency,
        documents: JSON.stringify(docs),
      },
    });
  }

  function UploadCard({
    label,
    doc,
    onPress,
  }: {
    label: string;
    doc: DocUpload | null;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity style={styles.uploadCard} onPress={onPress} activeOpacity={0.7}>
        {doc?.uri ? (
          <View style={styles.uploadPreview}>
            <Image source={{ uri: doc.uri }} style={styles.previewImage} />
            {doc.uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            <View style={styles.uploadCheck}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.green} />
            </View>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="camera-outline" size={32} color={Colors.muted} />
            <Text style={styles.uploadLabel}>{label}</Text>
            <Text style={styles.uploadHint}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.step}>Step 3 of 4</Text>
        <Text style={styles.title}>Upload Documents</Text>
        <Text style={styles.subtitle}>
          Required for MOM work eligibility verification.
        </Text>

        <UploadCard
          label="NRIC Front"
          doc={nric}
          onPress={() => pickImage(setNric, "nric_front")}
        />

        {isStudent && (
          <>
            <UploadCard
              label="Student Pass"
              doc={studentPass}
              onPress={() => pickImage(setStudentPass, "student_pass")}
            />
            <UploadCard
              label="Letter of Consent (LOC)"
              doc={loc}
              onPress={() => pickImage(setLoc, "loc")}
            />
          </>
        )}

        {isDependant && (
          <UploadCard
            label="Letter of Consent (LOC)"
            doc={loc}
            onPress={() => pickImage(setLoc, "loc")}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
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
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  step: { fontSize: 13, fontWeight: "600", color: Colors.accent, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", color: Colors.ink },
  subtitle: { fontSize: 15, color: Colors.muted, marginTop: 6, marginBottom: 28 },
  uploadCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    marginBottom: 14,
    overflow: "hidden",
  },
  uploadPlaceholder: {
    alignItems: "center",
    paddingVertical: 32,
  },
  uploadLabel: { fontSize: 15, fontWeight: "600", color: Colors.ink, marginTop: 10 },
  uploadHint: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  uploadPreview: { height: 160, position: "relative" },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadCheck: { position: "absolute", top: 10, right: 10 },
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
