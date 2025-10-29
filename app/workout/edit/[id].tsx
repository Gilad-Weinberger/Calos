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
import MediaUploadInput from "../../../components/workout-edit/MediaUploadInput";
import VisibilitySelector from "../../../components/workout-edit/VisibilitySelector";
import WorkoutEditActions from "../../../components/workout-edit/WorkoutEditActions";
import WorkoutEditExerciseList from "../../../components/workout-edit/WorkoutEditExerciseList";
import WorkoutMetadataForm from "../../../components/workout-edit/WorkoutMetadataForm";
import WorkoutStatsSummary from "../../../components/workout-edit/WorkoutStatsSummary";
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
    if (!user || !id) return;

    try {
      setIsSaving(true);

      // Upload new media files
      const newMediaItems = mediaItems.filter(
        (item) => !item.id.startsWith("existing-")
      );
      let mediaUrls: string[] = [];

      if (newMediaItems.length > 0) {
        const mediaToUpload = newMediaItems.map((item) => ({
          uri: item.uri,
          type: item.type,
        }));
        mediaUrls = await uploadWorkoutMediaFiles(
          user.user_id,
          id,
          mediaToUpload
        );
      }

      // Include existing media URLs
      const existingMediaUrls = mediaItems
        .filter((item) => item.id.startsWith("existing-"))
        .map((item) => item.uri);

      const allMediaUrls = [...existingMediaUrls, ...mediaUrls];

      // Update workout metadata
      await updateWorkoutMetadata(id, user.user_id, {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        media_urls: allMediaUrls,
        visibility,
      });

      // Update workout exercises
      await updateWorkoutExercises(id, user.user_id, exercises);

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
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.");
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
            <VisibilitySelector
              visibility={visibility}
              onChange={setVisibility}
            />

            {/* Media Upload */}
            <MediaUploadInput
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
        <WorkoutEditActions
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
