import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Colors } from "@/lib/colors";

function RootNavigator() {
  const { session, user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";

    if (!session) {
      if (!inAuth) router.replace("/(auth)/phone");
      return;
    }

    const status = user?.profile?.verificationStatus;

    if (!user || !status || status === "UNVERIFIED") {
      if (!inOnboarding) router.replace("/(onboarding)/name");
    } else if (status === "PENDING_VERIFICATION") {
      if (inAuth || inOnboarding) router.replace("/verification-pending");
      else if (segments[0] !== "verification-pending" && segments[0] !== "(tabs)") {
        router.replace("/verification-pending");
      }
    } else if (status === "REJECTED") {
      if (!inOnboarding) router.replace("/(onboarding)/documents");
    } else if (status === "VERIFIED") {
      if (inAuth || inOnboarding || segments[0] === "verification-pending") {
        router.replace("/(tabs)");
      }
    }
  }, [session, user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.paper, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="verification-pending" />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
