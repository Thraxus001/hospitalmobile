import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../lib/auth";

function Guard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while auth state is still loading
    if (loading) return;

    const first = segments[0] as string | undefined;
    const inAuth = first === "(auth)";
    const inTabs = first === "(tabs)";
    const isRoot = !first; // fresh launch with no segment yet

    if (!user && inTabs) {
      // Logged-out user trying to open a protected tab → send to welcome
      router.replace("/(auth)/welcome");
    } else if (user && inAuth) {
      // Logged-in user landing on auth screens → go to dashboard
      router.replace("/(tabs)");
    } else if (!user && isRoot) {
      // Fresh launch, not logged in → welcome screen
      router.replace("/(auth)/welcome");
    }
  }, [user, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="find-doctor"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="department/[specialty]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="doctor/[id]"
        options={{ title: "Book Appointment", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="pay/[id]"
        options={{ title: "Payment", headerBackVisible: false }}
      />
      <Stack.Screen
        name="lab-results"
        options={{ title: "Lab Results", headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="emergency"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Guard />
    </AuthProvider>
  );
}
