import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { AuthProvider, useAuth } from "../lib/context/AuthContext";

function RootLayoutNav() {
  const { authUser, user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "auth";

    if (!authUser) {
      // User is not authenticated
      if (!inAuthGroup && segments[0] !== undefined) {
        router.replace("/");
      }
    } else if (authUser && (!user?.name || !user?.profile_image_url)) {
      // User is authenticated but hasn't completed profile (missing name or profile image)
      if (!inAuthGroup || segments[1] !== "onboarding") {
        router.replace("/auth/onboarding");
      }
    } else if (authUser && user?.name && user?.profile_image_url) {
      // User is authenticated and has completed profile
      if (inAuthGroup) {
        router.replace("/(tabs)/home");
      }
    }
  }, [authUser, user, initializing, segments, router]);

  // Show loading screen while initializing
  if (initializing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
