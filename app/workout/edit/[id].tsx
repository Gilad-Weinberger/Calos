import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExerciseSetInput from "../../../components/record/ExerciseSetInput";
import { useAuth } from "../../../lib/context/AuthContext";
import { WorkoutExercise } from "../../../lib/functions/workoutFunctions";
import { supabase } from "../../../lib/utils/supabase";

interface WorkoutData {
  workout_id: string;
  workout_date: string;
  exercises: Array<{
    workout_exercise_id: string;
    exercise_id: string;
    sets: number;
    reps: number[];
    order_index: number;
    video_urls: string[];
    exercises: {
      name: string;
      type: "static" | "dynamic";
    };
  }>;
}

const WorkoutEdit: React.FC = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  useEffect(() => {
    if (user && id) {
      fetchWorkout();
    }
  }, [user, id]);

  const fetchWorkout = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("workouts")
        .select(
          `
          workout_id,
          workout_date,
          workout_exercises (
            workout_exercise_id,
            exercise_id,
            sets,
            reps,
            order_index,
            video_urls,
            exercises (
              name,
              type
            )
          )
        `
        )
        .eq("workout_id", id)
        .eq("user_id", user?.user_id)
        .single();

      if (error) {
        console.error("Error fetching workout:", error);
        Alert.alert("Error", "Failed to load workout");
        router.back();
        return;
      }

      if (!data) {
        Alert.alert("Error", "Workout not found");
        router.back();
        return;
      }

      setWorkout(data as WorkoutData);

      // Convert to WorkoutExercise format
      const workoutExercises: WorkoutExercise[] = (
        data.workout_exercises || []
      ).map((ex: any) => ({
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercises.name,
        exercise_type: ex.exercises.type,
        sets: ex.sets,
        reps: ex.reps,
        order_index: ex.order_index,
      }));

      setExercises(workoutExercises);
    } catch (error) {
      console.error("Error in fetchWorkout:", error);
      Alert.alert("Error", "Failed to load workout");
      router.back();
    } finally {
      setLoading(false);
    }
  };

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
    // Update order indices
    const reorderedExercises = newExercises.map((exercise, i) => ({
      ...exercise,
      order_index: i + 1,
    }));
    setExercises(reorderedExercises);
  };

  const handleSave = async () => {
    if (!user || !workout) {
      return;
    }

    try {
      setSaving(true);

      // Delete all existing workout exercises
      const { error: deleteError } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("workout_id", workout.workout_id);

      if (deleteError) {
        console.error("Error deleting workout exercises:", deleteError);
        throw deleteError;
      }

      // Insert updated workout exercises
      const workoutExercises = exercises.map((exercise, index) => ({
        workout_id: workout.workout_id,
        exercise_id: exercise.exercise_id,
        sets: exercise.sets,
        reps: exercise.reps,
        order_index: index + 1,
        video_urls: [], // Keep existing videos if any
      }));

      const { error: insertError } = await supabase
        .from("workout_exercises")
        .insert(workoutExercises);

      if (insertError) {
        console.error("Error inserting workout exercises:", insertError);
        throw insertError;
      }

      Alert.alert("Success!", "Workout updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-4">Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-4">
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-gray-900 mt-4">
            Workout Not Found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-600 rounded-lg py-3 px-6 mt-6"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                Edit Workout
              </Text>
              <Text className="text-base text-gray-600">
                {new Date(workout.workout_date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

          {/* Exercise List */}
          {exercises.length > 0 && (
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Exercises ({exercises.length})
              </Text>
              {exercises.map((exercise, index) => (
                <ExerciseSetInput
                  key={`${exercise.exercise_id}-${index}`}
                  exercise={exercise}
                  onUpdate={(updatedExercise) =>
                    handleExerciseUpdate(index, updatedExercise)
                  }
                  onRemove={() => handleExerciseRemove(index)}
                />
              ))}
            </View>
          )}

          {exercises.length === 0 && (
            <View className="bg-yellow-50 rounded-lg p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="warning" size={20} color="#f59e0b" />
                <Text className="text-yellow-900 ml-2 flex-1">
                  All exercises have been removed. Saving will delete this
                  workout.
                </Text>
              </View>
            </View>
          )}

          {/* Videos Section */}
          {workout.exercises.some((ex) => ex.video_urls?.length > 0) && (
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-3">
                Workout Videos
              </Text>
              {workout.exercises.map((ex, idx) =>
                ex.video_urls && ex.video_urls.length > 0 ? (
                  <View
                    key={idx}
                    className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
                  >
                    <Text className="text-base font-semibold text-gray-900 mb-2">
                      {ex.exercises.name}
                    </Text>
                    <View className="flex-row flex-wrap">
                      {ex.video_urls.map((url, vidIdx) => (
                        <View
                          key={vidIdx}
                          className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden mr-2 mb-2"
                        >
                          <Ionicons
                            name="videocam"
                            size={32}
                            color="#6b7280"
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              marginLeft: -16,
                              marginTop: -16,
                              zIndex: 1,
                            }}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null
              )}
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`rounded-lg py-4 px-6 ${
              saving ? "bg-gray-300" : "bg-blue-600"
            }`}
          >
            <Text
              className={`text-center font-semibold text-base ${
                saving ? "text-gray-500" : "text-white"
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutEdit;
