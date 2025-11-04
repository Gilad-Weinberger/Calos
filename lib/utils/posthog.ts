import Constants from "expo-constants";
import PostHog from "posthog-react-native";

// Create a no-op PostHog client for production
const createNoOpClient = () => ({
  identify: () => {},
  capture: () => {},
  reset: () => {},
  flush: () => {},
  shutdown: () => {},
  isFeatureEnabled: () => false,
  getFeatureFlag: () => undefined,
  onFeatureFlags: () => () => {},
  reloadFeatureFlags: () => {},
  group: () => {},
  alias: () => {},
  screen: () => {},
  register: () => {},
  unregister: () => {},
  debug: () => {},
  opt_in_capturing: () => {},
  opt_out_capturing: () => {},
  has_opted_in_capturing: () => false,
  has_opted_out_capturing: () => false,
  clear_opt_in_out_capturing: () => {},
  people: {
    set: () => {},
    set_once: () => {},
    increment: () => {},
    append: () => {},
    union: () => {},
    track_charge: () => {},
    clear_charges: () => {},
    delete_user: () => {},
  },
});

// Conditionally initialize PostHog based on environment
// Only disable PostHog in production builds, enable it in development and preview
const easChannel = Constants.expoConfig?.extra?.eas?.channel;
const isProduction = easChannel === "production";
const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "";

export const posthog = isProduction
  ? (createNoOpClient() as any)
  : new PostHog(posthogApiKey, {
      host: "https://us.i.posthog.com",
    });

export default posthog;
