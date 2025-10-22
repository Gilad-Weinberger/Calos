import { User as SupabaseUser } from "@supabase/supabase-js";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter, useSegments } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { posthog } from "../utils/posthog";
import { supabase } from "../utils/supabase";

interface User {
  user_id: string;
  email: string;
  name: string | null;
  username: string | null;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  followers?: string[];
  following?: string[];
  is_public?: boolean;
}

interface AuthContextType {
  authUser: SupabaseUser | null;
  user: User | null;
  loading: boolean;
  initializing: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUserProfile: (
    name: string,
    profileImageUrl?: string,
    username?: string
  ) => Promise<{ error: any }>;
  uploadProfileImage: (
    uri: string
  ) => Promise<{ url: string | null; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Fetch user profile from database
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<User | null> => {
      try {
        console.log(
          `[AuthContext] Fetching user profile for userId: ${userId}`
        );
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error(
            `[AuthContext] Error fetching user profile for ${userId}:`,
            error
          );
          return null;
        }

        console.log(`[AuthContext] Successfully fetched user profile:`, data);
        return data;
      } catch (error) {
        console.error(
          `[AuthContext] Exception fetching user profile for ${userId}:`,
          error
        );
        return null;
      }
    },
    []
  );

  // Create user profile manually (fallback when trigger fails)
  const createUserProfile = useCallback(
    async (userId: string, email: string): Promise<{ error: any }> => {
      try {
        console.log(
          `[AuthContext] Creating user profile manually for userId: ${userId}, email: ${email}`
        );
        const { error } = await supabase.from("users").insert({
          user_id: userId,
          email: email,
          name: null,
          profile_image_url: null,
        });

        if (error) {
          console.error(
            `[AuthContext] Error creating user profile for ${userId}:`,
            error
          );
          return { error };
        }

        console.log(
          `[AuthContext] Successfully created user profile for ${userId}`
        );
        return { error: null };
      } catch (error) {
        console.error(
          `[AuthContext] Exception creating user profile for ${userId}:`,
          error
        );
        return { error };
      }
    },
    []
  );

  // Ensure user profile exists (fetch or create)
  const ensureUserProfile = useCallback(
    async (userId: string, email: string): Promise<User | null> => {
      // First, try to fetch existing profile
      const profile = await fetchUserProfile(userId);
      if (profile) {
        return profile;
      }

      // If no profile exists, create it
      console.log(
        `[AuthContext] No profile found for user ${userId}, creating new profile`
      );
      const { error: createError } = await createUserProfile(userId, email);
      if (createError) {
        console.error(
          `[AuthContext] Failed to create profile for ${userId}:`,
          createError
        );
        return null;
      }

      // Fetch the newly created profile
      return await fetchUserProfile(userId);
    },
    [fetchUserProfile, createUserProfile]
  );

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          if (session?.user) {
            setAuthUser(session.user);

            // Ensure user profile exists (fetch or create)
            const userProfile = await ensureUserProfile(
              session.user.id,
              session.user.email!
            );
            setUser(userProfile);
          } else {
            setAuthUser(null);
            setUser(null);
          }
          setInitializing(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log(
        `[AuthContext] Auth state change: ${event}, user: ${session?.user?.id}`
      );

      if (session?.user) {
        setAuthUser(session.user);

        // Ensure user profile exists (fetch or create)
        const userProfile = await ensureUserProfile(
          session.user.id,
          session.user.email!
        );
        setUser(userProfile);
      } else {
        setAuthUser(null);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureUserProfile]);

  // Handle navigation based on authentication state
  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === "auth";
    const isIndexPage = !segments[0];

    if (!authUser) {
      // User is not authenticated
      if (!inAuthGroup && !isIndexPage) {
        router.replace("/");
      }
    } else if (authUser && user === null) {
      // User is authenticated but profile is still loading
      // Wait for profile to load before making navigation decisions
      return;
    } else if (
      authUser &&
      user &&
      (!user.name || !user.profile_image_url || !user.username)
    ) {
      // User is authenticated but hasn't completed profile (missing name, profile image, or username)
      if (!inAuthGroup || segments[1] !== "onboarding") {
        router.replace("/auth/onboarding");
      }
    } else if (
      authUser &&
      user?.name &&
      user?.profile_image_url &&
      user?.username
    ) {
      // User is authenticated and has completed profile
      if (inAuthGroup || isIndexPage) {
        router.replace("/(tabs)/home");
      }
    }
  }, [authUser, user, initializing, segments, router]);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log(`[AuthContext] Starting signup for email: ${email}`);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
        },
      });

      if (error) {
        console.error(`[AuthContext] Signup error for ${email}:`, error);
        return { error };
      }

      // Identify user first, then capture signup event
      if (data.user?.id) {
        posthog.identify(data.user.id, {
          email: email,
          signup_date: new Date().toISOString(),
        });

        posthog.capture("signup", {
          email: email,
          user_id: data.user.id,
          timestamp: new Date().toISOString(),
        });
      }

      console.log(
        `[AuthContext] Signup successful for ${email}, user:`,
        data.user?.id
      );

      // If email confirmation is disabled, the user is automatically signed in
      // The auth state change listener will handle setting the user state
      return { error: null };
    } catch (error) {
      console.error(`[AuthContext] Signup exception for ${email}:`, error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (uri: string) => {
    if (!authUser) {
      return { url: null, error: "No authenticated user" };
    }

    try {
      console.log(
        `[AuthContext] Starting profile image upload for user: ${authUser.id}`
      );
      console.log(`[AuthContext] Image URI: ${uri}`);

      // Create a unique filename with timestamp
      const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `${authUser.id}/profile-${timestamp}.${fileExt}`;

      console.log(`[AuthContext] Uploading file: ${fileName}`);

      // Read file as base64 using expo-file-system
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer for upload
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, byteArray, {
          contentType: `image/${fileExt}`,
          upsert: false, // Don't overwrite, create new file with timestamp
        });

      if (error) {
        console.error(`[AuthContext] Upload error:`, error);
        return { url: null, error };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      console.log(`[AuthContext] Upload successful, URL: ${urlData.publicUrl}`);
      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error(`[AuthContext] Upload exception:`, error);
      return { url: null, error };
    }
  };

  const updateUserProfile = async (
    name: string,
    profileImageUrl?: string,
    username?: string
  ) => {
    if (!authUser) {
      return { error: "No authenticated user" };
    }

    setLoading(true);
    try {
      const updateData: any = { name };
      if (profileImageUrl) {
        updateData.profile_image_url = profileImageUrl;
      }
      if (username) {
        updateData.username = username;
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("user_id", authUser.id);

      if (error) {
        return { error };
      }

      // Refresh user profile
      const updatedProfile = await fetchUserProfile(authUser.id);
      setUser(updatedProfile);

      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    authUser,
    user,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    uploadProfileImage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
