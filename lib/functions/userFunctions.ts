import { supabase } from "../utils/supabase";

export interface UserProfile {
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

export interface SearchUserResult {
  user_id: string;
  name: string | null;
  username: string | null;
  profile_image_url: string | null;
  is_public: boolean;
}

/**
 * Follow a user
 */
export const followUser = async (
  followerId: string,
  followeeId: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase.rpc("follow_user", {
      follower_id: followerId,
      followee_id: followeeId,
    });

    if (error) {
      console.error("Error following user:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Exception in followUser:", error);
    return { error };
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (
  followerId: string,
  followeeId: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase.rpc("unfollow_user", {
      follower_id: followerId,
      followee_id: followeeId,
    });

    if (error) {
      console.error("Error unfollowing user:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Exception in unfollowUser:", error);
    return { error };
  }
};

/**
 * Search users by name or username
 */
export const searchUsers = async (
  query: string
): Promise<{ data: SearchUserResult[] | null; error: any }> => {
  try {
    if (!query.trim()) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from("users")
      .select("user_id, name, username, profile_image_url, is_public")
      .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
      .eq("is_public", true)
      .limit(20);

    if (error) {
      console.error("Error searching users:", error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Exception in searchUsers:", error);
    return { data: null, error };
  }
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (
  userId: string
): Promise<{ data: UserProfile | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Exception in getUserProfile:", error);
    return { data: null, error };
  }
};

/**
 * Check if a user is following another user
 */
export const isFollowing = async (
  followerId: string,
  followeeId: string
): Promise<{ isFollowing: boolean; error: any }> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("following")
      .eq("user_id", followerId)
      .single();

    if (error) {
      console.error("Error checking follow status:", error);
      return { isFollowing: false, error };
    }

    const isFollowing = data?.following?.includes(followeeId) || false;
    return { isFollowing, error: null };
  } catch (error) {
    console.error("Exception in isFollowing:", error);
    return { isFollowing: false, error };
  }
};

/**
 * Check if a username is available
 */
export const checkUsernameAvailable = async (
  username: string,
  excludeUserId?: string
): Promise<{ available: boolean; error: any }> => {
  try {
    if (!username || username.length < 3 || username.length > 20) {
      return { available: false, error: null };
    }

    // Validate username format (alphanumeric + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return { available: false, error: null };
    }

    let query = supabase
      .from("users")
      .select("user_id")
      .eq("username", username);

    if (excludeUserId) {
      query = query.neq("user_id", excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking username availability:", error);
      return { available: false, error };
    }

    const available = !data || data.length === 0;
    return { available, error: null };
  } catch (error) {
    console.error("Exception in checkUsernameAvailable:", error);
    return { available: false, error };
  }
};

/**
 * Update username
 */
export const updateUsername = async (
  userId: string,
  newUsername: string
): Promise<{ error: any }> => {
  try {
    // First check if username is available
    const { available, error: checkError } = await checkUsernameAvailable(
      newUsername,
      userId
    );

    if (checkError) {
      return { error: checkError };
    }

    if (!available) {
      return { error: { message: "Username is already taken" } };
    }

    const { error } = await supabase
      .from("users")
      .update({ username: newUsername })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating username:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Exception in updateUsername:", error);
    return { error };
  }
};

/**
 * Get followers list
 */
export const getFollowers = async (
  userId: string
): Promise<{ data: UserProfile[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "user_id, name, username, profile_image_url, created_at, updated_at"
      )
      .contains("following", [userId]);

    if (error) {
      console.error("Error fetching followers:", error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Exception in getFollowers:", error);
    return { data: null, error };
  }
};

/**
 * Get following list
 */
export const getFollowing = async (
  userId: string
): Promise<{ data: UserProfile[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "user_id, name, username, profile_image_url, created_at, updated_at"
      )
      .contains("followers", [userId]);

    if (error) {
      console.error("Error fetching following:", error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Exception in getFollowing:", error);
    return { data: null, error };
  }
};

/**
 * Update privacy settings (profile visibility)
 */
export const updatePrivacySettings = async (
  userId: string,
  isPublic: boolean
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from("users")
      .update({ is_public: isPublic })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating privacy settings:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Exception in updatePrivacySettings:", error);
    return { error };
  }
};

/**
 * Delete user account and all associated data
 * WARNING: This is a destructive operation that cannot be undone
 */
export const deleteUserAccount = async (
  userId: string
): Promise<{ error: any }> => {
  try {
    // Note: This will cascade delete all related data due to foreign key constraints
    // The auth user will also be deleted when the user record is deleted
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting user account:", error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error("Exception in deleteUserAccount:", error);
    return { error };
  }
};
