import Constants from "expo-constants";
import PostHog from "posthog-react-native";

// Create a no-op PostHog client for non-production environments
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

// Check if we're in a Node.js environment (during export/SSR)
// This prevents PostHog from initializing during build/export where window is not available
const isNodeEnvironment =
  typeof process !== "undefined" && process.versions && process.versions.node;

// Conditionally initialize PostHog based on environment
// Only enable PostHog in production builds, disable it in development and preview
// Also disable during SSR/export (Node.js environment)
const easChannel = Constants.expoConfig?.extra?.eas?.channel;
const isProduction = easChannel === "production";
const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "";

// Initialize PostHog only in production client environments (not during export/SSR)
let posthogInstance: any;

if (isNodeEnvironment || !isProduction) {
  // Use no-op client during export/SSR or in non-production environments
  posthogInstance = createNoOpClient();
} else {
  try {
    // Try to initialize PostHog in production client environment
    posthogInstance = new PostHog(posthogApiKey, {
      host: "https://us.i.posthog.com",
    });
  } catch (error) {
    // Fallback to no-op if initialization fails
    console.warn("PostHog initialization failed, using no-op client:", error);
    posthogInstance = createNoOpClient();
  }
}

export const posthog = posthogInstance;
export default posthog;
