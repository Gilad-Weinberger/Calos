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
const isProduction =
  Constants.expoConfig?.extra?.eas?.projectId &&
  (Constants.expoConfig?.extra?.eas?.channel === "production" ||
    process.env.NODE_ENV === "production");

export const posthog = isProduction
  ? (createNoOpClient() as any)
  : new PostHog(process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "", {
      host: "https://us.i.posthog.com",
    });

export default posthog;
