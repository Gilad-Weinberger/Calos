import Constants from "expo-constants";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider } from "posthog-react-native";
import { ActivityIndicator, I18nManager, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { AuthProvider, useAuth } from "../lib/context/AuthContext";
import { posthog } from "../lib/utils/posthog";

// Force LTR layout
I18nManager.forceRTL(false);
I18nManager.allowRTL(false);

function RootLayoutNav() {
  const { initializing } = useAuth();

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
  // Check if PostHog should be enabled (not in production)
  const isProduction =
    Constants.expoConfig?.extra?.eas?.projectId &&
    (Constants.expoConfig?.extra?.eas?.channel === "production" ||
      process.env.NODE_ENV === "production");

  const shouldUsePostHog = !isProduction && posthog;

  const content = (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );

  // Conditionally wrap with PostHogProvider
  if (shouldUsePostHog) {
    return <PostHogProvider client={posthog}>{content}</PostHogProvider>;
  }

  return content;
}
