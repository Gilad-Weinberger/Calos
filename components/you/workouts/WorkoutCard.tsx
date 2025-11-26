import { router } from "expo-router";
import React, { memo, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  calculateTotalReps,
  calculateTotalSets,
  calculateWorkoutDuration,
  deleteWorkout,
  formatWorkoutDate,
  getBestAchievement,
  WorkoutExercise,
} from "../../../lib/functions/workoutFunctions";
import { formatDuration } from "../../../lib/utils/timer";
import ImageViewerModal from "../../ui/ImageViewerModal";
import VideoPlayerModal from "../../ui/VideoPlayerModal";
import WorkoutCardAchievement from "./WorkoutCardAchievement";
import WorkoutCardExerciseCarousel from "./WorkoutCardExerciseCarousel";
import WorkoutCardHeader from "./WorkoutCardHeader";
import WorkoutCardMediaCarousel from "./WorkoutCardMediaCarousel";
import WorkoutCardMenu from "./WorkoutCardMenu";
import WorkoutCardStats from "./WorkoutCardStats";

type MediaItem = 
  | { type: 'video'; url: string; exerciseName: string; exerciseType: "static" | "dynamic"; sets: number; reps: number[] }
  | { type: 'image'; url: string };

interface WorkoutCardProps {
  workout: {
    workout_id: string;
    workout_date: string;
    start_time?: string;
    end_time?: string;
    plan_id?: string;
    plan_workout_letter?: string;
    title?: string;
    description?: string;
    media_urls?: string[];
    workout_exercises: {
      exercise_id: string;
      sets: number;
      reps: number[];
      order_index: number;
      superset_group?: string;
      video_urls?: string[];
      exercises: {
        name: string;
        type: "static" | "dynamic";
      };
    }[];
  };
  userName: string;
  userProfileImage: string | null;
  userId?: string; // Add userId prop for navigation
  title?: string;
  planName?: string;
  achievements?: {
    icon: string;
    message: string;
  }[];
  onWorkoutDeleted?: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = memo(
  ({
    workout,
    userName,
    userProfileImage,
    userId,
    achievements,
    onWorkoutDeleted,
  }) => {
    const { user } = useAuth();
    const [menuVisible, setMenuVisible] = useState(false);
    const [mediaModalVisible, setMediaModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    // Memoize expensive calculations
    const exercises: WorkoutExercise[] = useMemo(
      () =>
        workout.workout_exercises.map((we) => ({
          exercise_id: we.exercise_id,
          exercise_name: we.exercises.name,
          exercise_type: we.exercises.type,
          sets: we.sets,
          reps: we.reps,
          order_index: we.order_index,
          superset_group: we.superset_group,
        })),
      [workout.workout_exercises]
    );

    const {
      totalSets,
      totalExercises,
      formattedDate,
      bestAchievement,
      durationText,
    } = useMemo(() => {
      const totalSets = calculateTotalSets(exercises);
      const totalReps = calculateTotalReps(exercises);
      const totalExercises = exercises.length;
      const formattedDate = formatWorkoutDate(workout.workout_date);
      const bestAchievement = getBestAchievement(achievements || []);

      // Calculate workout duration if available
      const durationSeconds = calculateWorkoutDuration(
        workout.start_time || null,
        workout.end_time || null
      );
      const durationText = durationSeconds
        ? formatDuration(durationSeconds)
        : null;

      return {
        totalSets,
        totalReps,
        totalExercises,
        formattedDate,
        bestAchievement,
        durationText,
      };
    }, [
      exercises,
      workout.workout_date,
      workout.start_time,
      workout.end_time,
      achievements,
    ]);

    const handleCongratsPress = () => {
      router.push({
        pathname: "/workout/achievements/[id]",
        params: { id: workout.workout_id },
      });
    };

    const handleEditPress = () => {
      setMenuVisible(false);
      router.push({
        pathname: "/workout/edit/[id]",
        params: { id: workout.workout_id },
      });
    };

    const handleDeletePress = () => {
      setMenuVisible(false);

      // Check if user is available before showing confirmation
      if (!user?.user_id) {
        Alert.alert(
          "Error",
          "You must be logged in to delete a workout. Please sign in and try again."
        );
        return;
      }

      // Prevent multiple deletions at once
      if (isDeleting) {
        return;
      }

      Alert.alert(
        "Delete Workout",
        "Are you sure you want to delete this workout? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setIsDeleting(true);
              try {
                await deleteWorkout(workout.workout_id, user.user_id);
                Alert.alert("Success", "Workout deleted successfully");
                if (onWorkoutDeleted) {
                  onWorkoutDeleted();
                }
              } catch (error) {
                console.error("Error deleting workout:", error);
                const errorMessage =
                  error instanceof Error
                    ? error.message
                    : "Failed to delete workout. Please try again.";
                Alert.alert("Error", errorMessage);
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ]
      );
    };

    // Memoize media-related calculations
    const { mediaItems, hasAnyMedia } = useMemo(() => {
      // Collect all videos with context
      const videos: MediaItem[] = workout.workout_exercises.flatMap((ex) => {
        if (!ex.video_urls || ex.video_urls.length === 0) return [];
        return ex.video_urls.map((url) => ({
          type: 'video' as const,
          url,
          exerciseName: ex.exercises.name,
          exerciseType: ex.exercises.type,
          sets: ex.sets,
          reps: ex.reps,
        }));
      });

      // Collect workout images
      const images: MediaItem[] = (workout.media_urls || []).map((url) => ({
        type: 'image' as const,
        url,
      }));

      // Combine in order: videos → images
      const mediaItems = [...videos, ...images];
      const hasAnyMedia = mediaItems.length > 0;

      return { mediaItems, hasAnyMedia };
    }, [workout.workout_exercises, workout.media_urls]);

    const handleMediaPress = (media: MediaItem) => {
      setSelectedMedia(media);
      setMediaModalVisible(true);
    };

    const handleUserPress = () => {
      if (userId) {
        router.push({
          pathname: "/profile/[id]",
          params: { id: userId },
        });
      }
    };

    // Check if current user owns this workout
    const isOwnWorkout = user?.user_id === userId;

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
        <WorkoutCardHeader
          userName={userName}
          userProfileImage={userProfileImage}
          formattedDate={formattedDate}
          userId={userId}
          onUserPress={handleUserPress}
          onMenuPress={() => setMenuVisible(true)}
          showMenu={isOwnWorkout}
        />

        <WorkoutCardMenu
          visible={menuVisible}
          isDeleting={isDeleting}
          onClose={() => setMenuVisible(false)}
          onEdit={handleEditPress}
          onDelete={handleDeletePress}
        />

        {/* Title Section */}
        <Text className="text-xl font-bold text-gray-800 flex-1 mt-1">
          {workout.title || `Workout Session`}
        </Text>

        {/* Description Section */}
        {workout.description && (
          <Text className="text-sm text-gray-600 leading-5">
            {workout.description}
          </Text>
        )}

        <WorkoutCardStats
          totalExercises={totalExercises}
          totalSets={totalSets}
          durationText={durationText}
          achievementCount={achievements?.length || 0}
        />

        {bestAchievement && (
          <WorkoutCardAchievement
            achievement={bestAchievement}
            onPress={handleCongratsPress}
          />
        )}

        {/* Unified Media Carousel: Videos → Images → Exercises */}
        {hasAnyMedia ? (
          <WorkoutCardMediaCarousel
            mediaItems={mediaItems}
            exercises={exercises}
            onMediaPress={handleMediaPress}
          />
        ) : (
          <WorkoutCardExerciseCarousel exercises={exercises} />
        )}
        {/* Media Viewer Modal */}
        {selectedMedia && (
          selectedMedia.type === 'video' ? (
            <VideoPlayerModal
              visible={mediaModalVisible}
              onClose={() => {
                setMediaModalVisible(false);
                setSelectedMedia(null);
              }}
              videoUrl={selectedMedia.url}
              exerciseName={selectedMedia.exerciseName}
              exerciseType={selectedMedia.exerciseType}
              sets={selectedMedia.sets}
              reps={selectedMedia.reps}
            />
          ) : (
            <ImageViewerModal
              visible={mediaModalVisible}
              onClose={() => {
                setMediaModalVisible(false);
                setSelectedMedia(null);
              }}
              imageUrl={selectedMedia.url}
            />
          )
        )}
      </View>
    );
  }
);

WorkoutCard.displayName = "WorkoutCard";

export default WorkoutCard;
