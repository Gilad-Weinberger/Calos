import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FullPageTopBar from "../../../components/layout/FullPageTopBar";
import WorkoutEditActionButtons from "../../../components/workout/edit/WorkoutEditActionButtons";
import WorkoutEditExerciseList from "../../../components/workout/edit/WorkoutEditExerciseList";
import WorkoutMediaUploadInput from "../../../components/workout/edit/WorkoutMediaUploadInput";
import WorkoutMetadataForm from "../../../components/workout/edit/WorkoutMetadataForm";
import WorkoutStatsSummary from "../../../components/workout/edit/WorkoutStatsSummary";
import WorkoutVisibilitySelector from "../../../components/workout/edit/WorkoutVisibilitySelector";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  calculateTotalReps,
  calculateTotalSets,
  calculateWorkoutDuration,
  DatabaseWorkout,
  deleteWorkout,
  getWorkoutById,
  updateWorkoutExercises,
  updateWorkoutMetadata,
  uploadWorkoutMediaFiles,
  WorkoutExercise,
} from "../../../lib/functions/workoutFunctions";

interface MediaItem {
  id: string;
  uri: string;
  type: "image" | "video";
  name?: string;
}

const WorkoutEditScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [workout, setWorkout] = useState<DatabaseWorkout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<
    "public" | "followers" | "private"
  >("public");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const loadWorkout = useCallback(async () => {
    if (!id || !user?.user_id) return;

    try {
      setIsLoading(true);
      const workoutData = await getWorkoutById(id, user.user_id);

      setWorkout(workoutData);
      setTitle(workoutData.title || "Workout Session");
      setDescription(workoutData.description || "");
      setVisibility(
        (workoutData.visibility as "public" | "followers" | "private") ||
          "public"
      );

      // Convert workout exercises to WorkoutExercise format
      const workoutExercises: WorkoutExercise[] =
        workoutData.workout_exercises.map((ex) => ({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercises.name,
          exercise_type: ex.exercises.type,
          sets: ex.sets,
          reps: ex.reps,
          order_index: ex.order_index,
          superset_group: ex.superset_group,
          video_urls: ex.video_urls,
        }));
      setExercises(workoutExercises);

      // Convert existing media URLs to MediaItem format
      if (workoutData.media_urls && workoutData.media_urls.length > 0) {
        const existingMedia: MediaItem[] = workoutData.media_urls.map(
          (url, index) => ({
            id: `existing-${index}`,
            uri: url,
            type:
              url.includes(".mp4") || url.includes(".mov") ? "video" : "image",
            name: `media-${index}`,
          })
        );
        setMediaItems(existingMedia);
      }
    } catch (error) {
      console.error("Error loading workout:", error);
      Alert.alert("Error", "Failed to load workout data");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.user_id, router]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  const handleExerciseUpdate = (
    index: number,
    updatedExercise: WorkoutExercise
  ) => {
    const newExercises = [...exercises];
    newExercises[index] = updatedExercise;
    setExercises(newExercises);
  };

  const handleExerciseRemove = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
  };

  const handleSave = async () => {
    if (!user || !id) {
      console.log("[handleSave] Missing user or workout ID");
      return;
    }

    try {
      setIsSaving(true);
      console.log("[handleSave] Starting save process for workout:", id);
      console.log("[handleSave] Total media items:", mediaItems.length);

      // Upload new media files
      const newMediaItems = mediaItems.filter(
        (item) => !item.id.startsWith("existing-")
      );
      console.log(
        "[handleSave] New media items to upload:",
        newMediaItems.length
      );
      console.log(
        "[handleSave] New media items:",
        newMediaItems.map((item) => ({
          id: item.id,
          uri: item.uri,
          type: item.type,
        }))
      );

      let mediaUrls: string[] = [];

      if (newMediaItems.length > 0) {
        console.log("[handleSave] Starting media upload...");
        const mediaToUpload = newMediaItems.map((item) => ({
          uri: item.uri,
          type: item.type,
        }));

        try {
          mediaUrls = await uploadWorkoutMediaFiles(
            user.user_id,
            id,
            mediaToUpload
          );
          console.log(
            "[handleSave] Media upload successful. Uploaded URLs:",
            mediaUrls
          );
        } catch (uploadError) {
          console.error("[handleSave] Media upload failed:", uploadError);
          throw new Error(
            `Failed to upload media: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`
          );
        }
      } else {
        console.log("[handleSave] No new media to upload");
      }

      // Include existing media URLs
      const existingMediaUrls = mediaItems
        .filter((item) => item.id.startsWith("existing-"))
        .map((item) => item.uri);
      console.log(
        "[handleSave] Existing media URLs count:",
        existingMediaUrls.length
      );
      console.log("[handleSave] Existing media URLs:", existingMediaUrls);

      const allMediaUrls = [...existingMediaUrls, ...mediaUrls];
      console.log(
        "[handleSave] Total media URLs to save:",
        allMediaUrls.length
      );
      console.log("[handleSave] All media URLs:", allMediaUrls);

      // Update workout metadata
      console.log("[handleSave] Updating workout metadata...");
      try {
        await updateWorkoutMetadata(id, user.user_id, {
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          media_urls: allMediaUrls,
          visibility,
        });
        console.log("[handleSave] Workout metadata updated successfully");
      } catch (metadataError) {
        console.error("[handleSave] Metadata update failed:", metadataError);
        throw new Error(
          `Failed to update workout metadata: ${metadataError instanceof Error ? metadataError.message : String(metadataError)}`
        );
      }

      // Update workout exercises
      console.log("[handleSave] Updating workout exercises...");
      try {
        await updateWorkoutExercises(id, user.user_id, exercises);
        console.log("[handleSave] Workout exercises updated successfully");
      } catch (exercisesError) {
        console.error("[handleSave] Exercises update failed:", exercisesError);
        throw new Error(
          `Failed to update workout exercises: ${exercisesError instanceof Error ? exercisesError.message : String(exercisesError)}`
        );
      }

      console.log("[handleSave] Save process completed successfully");
      Alert.alert(
        "Workout Saved!",
        "Your workout has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/you"),
          },
        ]
      );
    } catch (error) {
      console.error("[handleSave] Error saving workout:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save workout. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard Workout",
      "Are you sure you want to discard this workout? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            if (!user || !id) return;

            try {
              setIsDiscarding(true);
              await deleteWorkout(id, user.user_id);
              router.replace("/(tabs)/you");
            } catch (error) {
              console.error("Error discarding workout:", error);
              Alert.alert(
                "Error",
                "Failed to discard workout. Please try again."
              );
            } finally {
              setIsDiscarding(false);
            }
          },
        },
      ]
    );
  };

  const getWorkoutStats = () => {
    if (!workout) return { totalSets: 0, totalReps: 0, duration: 0 };

    const totalSets = calculateTotalSets(exercises);
    const totalReps = calculateTotalReps(exercises);
    const duration = calculateWorkoutDuration(
      workout.start_time || null,
      workout.end_time ?? null
    );

    return { totalSets, totalReps, duration: duration ?? 0 };
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading workout...</Text>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-600">Workout not found</Text>
        <TouchableOpacity
          className="mt-4 px-6 py-2 bg-blue-500 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const stats = getWorkoutStats();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <FullPageTopBar title="Edit Workout" />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4 gap-y-4">
            {/* Title + Description */}
            <WorkoutMetadataForm
              title={title}
              description={description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
            />

            {/* Exercises List */}
            <WorkoutEditExerciseList
              exercises={exercises}
              onExerciseUpdate={handleExerciseUpdate}
              onExerciseRemove={handleExerciseRemove}
            />

            {/* Visibility Selector */}
            <WorkoutVisibilitySelector
              visibility={visibility}
              onChange={setVisibility}
            />

            {/* Media Upload */}
            <WorkoutMediaUploadInput
              onMediaChange={setMediaItems}
              initialMedia={mediaItems}
              maxItems={10}
            />

            {/* Workout Stats */}
            <WorkoutStatsSummary
              totalSets={stats.totalSets}
              totalReps={stats.totalReps}
              duration={stats.duration}
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <WorkoutEditActionButtons
          onSave={handleSave}
          onDiscard={handleDiscard}
          isSaving={isSaving}
          isDiscarding={isDiscarding}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WorkoutEditScreen;
