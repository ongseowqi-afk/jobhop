import { Stack } from "expo-router";
import { Colors } from "@/lib/colors";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.paper },
        headerTintColor: Colors.ink,
        headerShadowVisible: false,
        headerTitle: "",
      }}
    />
  );
}
