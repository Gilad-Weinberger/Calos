import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

// Check if we're in a client environment (React Native/Web) vs SSR (Node.js)
const isClient = typeof window !== "undefined";

// Create Supabase client with conditional storage
export const supabase = createClient(
  supabaseUrl!,
  supabasePublishableKey! as string,
  {
    auth: {
      // Only use AsyncStorage in client environments (React Native/Web)
      // In SSR (Node.js), skip storage to avoid window reference errors
      storage: isClient ? AsyncStorage : undefined,
      autoRefreshToken: true,
      persistSession: isClient, // Only persist session in client environments
      detectSessionInUrl: false,
    },
  }
);
