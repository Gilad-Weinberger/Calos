import { supabase } from "../utils/supabase";

export interface UserProfile {
  user_id: string;
  email: string;
  name: string | null;
  description: string | null;
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
  description: string | null;
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
 * Search users by name
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
      .select("user_id, name, description, profile_image_url, is_public")
      .ilike("name", `%${query}%`)
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
 * Get followers list
 */
export const getFollowers = async (
  userId: string
): Promise<{ data: UserProfile[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "user_id, email, name, description, profile_image_url, created_at, updated_at"
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
        "user_id, email, name, description, profile_image_url, created_at, updated_at"
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

/**
 * Get user workout statistics
 */
export const getUserWorkoutStats = async (
  userId: string
): Promise<{
  data: {
    totalWorkouts: number;
    totalSets: number;
    totalReps: number;
    thisWeekWorkouts: number;
    thisWeekSets: number;
    thisWeekReps: number;
  } | null;
  error: any;
}> => {
  try {
    // Get all workouts for the user
    const { data: workouts, error: workoutsError } = await supabase
      .from("workouts")
      .select(
        `
        workout_id,
        workout_date,
        workout_exercises (
          sets,
          reps
        )
      `
      )
      .eq("user_id", userId);

    if (workoutsError) {
      console.error("Error fetching user workouts:", workoutsError);
      return { data: null, error: workoutsError };
    }

    if (!workouts || workouts.length === 0) {
      return {
        data: {
          totalWorkouts: 0,
          totalSets: 0,
          totalReps: 0,
          thisWeekWorkouts: 0,
          thisWeekSets: 0,
          thisWeekReps: 0,
        },
        error: null,
      };
    }

    // Calculate this week's date range
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    let totalSets = 0;
    let totalReps = 0;
    let thisWeekWorkouts = 0;
    let thisWeekSets = 0;
    let thisWeekReps = 0;

    workouts.forEach((workout) => {
      const workoutDate = new Date(workout.workout_date);
      const isThisWeek = workoutDate >= startOfWeek && workoutDate <= endOfWeek;

      if (isThisWeek) {
        thisWeekWorkouts++;
      }

      workout.workout_exercises.forEach((exercise: any) => {
        const exerciseSets = exercise.sets || 0;
        const exerciseReps =
          exercise.reps?.reduce((sum: number, rep: number) => sum + rep, 0) ||
          0;

        totalSets += exerciseSets;
        totalReps += exerciseReps;

        if (isThisWeek) {
          thisWeekSets += exerciseSets;
          thisWeekReps += exerciseReps;
        }
      });
    });

    return {
      data: {
        totalWorkouts: workouts.length,
        totalSets,
        totalReps,
        thisWeekWorkouts,
        thisWeekSets,
        thisWeekReps,
      },
      error: null,
    };
  } catch (error) {
    console.error("Exception in getUserWorkoutStats:", error);
    return { data: null, error };
  }
};

/**
 * Get user's recent media (videos and images)
 */
export const getUserRecentMedia = async (
  userId: string,
  limit: number = 4
): Promise<{
  data:
    | {
        url: string;
        type: "video" | "image";
        exerciseName?: string;
        workoutDate: string;
      }[]
    | null;
  error: any;
}> => {
  try {
    // Get recent workouts with video URLs
    const { data: workouts, error: workoutsError } = await supabase
      .from("workouts")
      .select(
        `
        workout_id,
        workout_date,
        workout_exercises (
          video_urls,
          exercises (
            name
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("workout_date", { ascending: false })
      .limit(10); // Get more workouts to find enough media

    if (workoutsError) {
      console.error("Error fetching user workouts for media:", workoutsError);
      return { data: null, error: workoutsError };
    }

    if (!workouts || workouts.length === 0) {
      return { data: [], error: null };
    }

    const mediaItems: {
      url: string;
      type: "video" | "image";
      exerciseName?: string;
      workoutDate: string;
    }[] = [];

    // Collect all video URLs from workouts
    workouts.forEach((workout) => {
      workout.workout_exercises.forEach((exercise: any) => {
        if (exercise.video_urls && exercise.video_urls.length > 0) {
          exercise.video_urls.forEach((url: string) => {
            if (mediaItems.length < limit) {
              mediaItems.push({
                url,
                type: "video",
                exerciseName: exercise.exercises?.name,
                workoutDate: workout.workout_date,
              });
            }
          });
        }
      });
    });

    // If we don't have enough videos, we could add profile images here
    // For now, we'll just return what we have

    return { data: mediaItems, error: null };
  } catch (error) {
    console.error("Exception in getUserRecentMedia:", error);
    return { data: null, error };
  }
};
