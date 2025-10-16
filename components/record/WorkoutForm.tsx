import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/context/AuthContext";
import {
  Exercise,
  saveCompleteWorkout,
  WorkoutExercise,
} from "../../lib/functions/workoutFunctions";
import ExerciseSelector from "./ExerciseSelector";
import ExerciseSetInput from "./ExerciseSetInput";

const WorkoutForm: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Generate default workout title
  const generateWorkoutTitle = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `Workout - ${dateStr}`;
  }, []);

  // Initialize workout title
  React.useEffect(() => {
    if (!workoutTitle) {
      setWorkoutTitle(generateWorkoutTitle());
    }
  }, [workoutTitle, generateWorkoutTitle]);

  const handleExerciseSelect = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.name,
      exercise_type: exercise.type,
      sets: 3,
      reps: [10, 10, 10], // Default reps as integers
      order_index: exercises.length + 1,
    };

    console.log(
      "New exercise created with reps:",
      newWorkoutExercise.reps,
      "Type:",
      typeof newWorkoutExercise.reps[0]
    );
    setExercises([...exercises, newWorkoutExercise]);
  };

  const handleExerciseUpdate = (
    index: number,
    updatedExercise: WorkoutExercise
  ) => {
    console.log(
      "Exercise updated with reps:",
      updatedExercise.reps,
      "Type:",
      typeof updatedExercise.reps[0]
    );
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

  const validateForm = () => {
    if (!workoutTitle.trim()) {
      Alert.alert("Invalid Title", "Please enter a workout title");
      return false;
    }

    if (exercises.length === 0) {
      Alert.alert(
        "No Exercises",
        "Please add at least one exercise to your workout"
      );
      return false;
    }

    // Check if all exercises have valid sets and reps
    for (const exercise of exercises) {
      if (exercise.sets < 1) {
        Alert.alert(
          "Invalid Sets",
          `Please set at least 1 set for ${exercise.exercise_name}`
        );
        return false;
      }

      if (exercise.reps.some((rep) => rep < 1)) {
        Alert.alert(
          "Invalid Reps",
          `Please enter valid reps for all sets of ${exercise.exercise_name}`
        );
        return false;
      }
    }

    return true;
  };

  const handleSaveWorkout = async () => {
    if (!user) {
      Alert.alert("Authentication Error", "Please sign in to save workouts");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      const workoutData = {
        title: workoutTitle.trim(),
        exercises: exercises,
      };

      await saveCompleteWorkout(user.user_id, workoutData);

      Alert.alert("Success!", "Your workout has been saved successfully", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setWorkoutTitle(generateWorkoutTitle());
            setExercises([]);
            // Navigate to you page
            router.push("/(tabs)/you");
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedExerciseIds = exercises.map((ex) => ex.exercise_id);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Create Workout
            </Text>
            <Text className="text-base text-gray-600">
              Select exercises and set your targets
            </Text>
          </View>

          {/* Workout Title */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Workout Title
            </Text>
            <TextInput
              value={workoutTitle}
              onChangeText={setWorkoutTitle}
              placeholder="Enter workout title..."
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </View>

          {/* Exercise Selector */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Add Exercise
            </Text>
            <ExerciseSelector
              onExerciseSelect={handleExerciseSelect}
              selectedExerciseIds={selectedExerciseIds}
            />
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

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveWorkout}
            disabled={isSaving || exercises.length === 0}
            className={`rounded-lg py-4 px-6 ${
              isSaving || exercises.length === 0 ? "bg-gray-300" : "bg-blue-600"
            }`}
          >
            <Text
              className={`text-center font-semibold text-base ${
                isSaving || exercises.length === 0
                  ? "text-gray-500"
                  : "text-white"
              }`}
            >
              {isSaving ? "Saving..." : "Save Workout"}
            </Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutForm;
