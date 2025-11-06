import { Ionicons } from "@expo/vector-icons";
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
import { useAuth } from "../../../lib/context/AuthContext";
import {
  analyzeWorkoutVideos,
  VideoAnalysisResult,
} from "../../../lib/functions/videoFunctions";
import {
  Exercise,
  saveCompleteWorkout,
  WorkoutExercise,
} from "../../../lib/functions/workoutFunctions";
import WorkoutAnalysisResults from "../shared/WorkoutAnalysisResults";
import WorkoutVideoUploadMode from "../shared/WorkoutVideoUploadMode";
import ExerciseSelector from "./ExerciseSelector";
import WorkoutExerciseList from "./WorkoutExerciseList";
import WorkoutModeSelector from "./WorkoutModeSelector";
import WorkoutSaveButton from "./WorkoutSaveButton";
import WorkoutTitleInput from "./WorkoutTitleInput";

type WorkoutMode = "manual" | "video" | "analyzing" | "results";

const ManualWorkoutForm: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<WorkoutMode>("manual");
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysisResult[]>(
    []
  );
  const [selectedForSuperset, setSelectedForSuperset] = useState<number[]>([]);
  const [nextSupersetId, setNextSupersetId] = useState(1);

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
    // Remove from superset selection if selected
    setSelectedForSuperset((prev) => prev.filter((i) => i !== index));
  };

  const toggleExerciseSelection = (index: number) => {
    setSelectedForSuperset((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const createSuperset = () => {
    if (selectedForSuperset.length < 2) {
      Alert.alert(
        "Select Exercises",
        "Please select at least 2 exercises to create a superset"
      );
      return;
    }

    const supersetId = nextSupersetId.toString();
    const newExercises = exercises.map((exercise, index) => {
      if (selectedForSuperset.includes(index)) {
        return { ...exercise, superset_group: supersetId };
      }
      return exercise;
    });

    setExercises(newExercises);
    setSelectedForSuperset([]);
    setNextSupersetId(nextSupersetId + 1);
    Alert.alert("Success", "Superset created!");
  };

  const removeFromSuperset = (index: number) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], superset_group: undefined };
    setExercises(newExercises);
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

  const handleVideosUploaded = async (videoUrls: string[]) => {
    try {
      setMode("analyzing");

      // Call the analysis Edge Function
      const results = await analyzeWorkoutVideos(videoUrls, user?.user_id);

      setAnalysisResults(results);
      setMode("results");
    } catch (error) {
      console.error("Error analyzing videos:", error);
      Alert.alert(
        "Analysis Error",
        "Failed to analyze videos. Please try again.",
        [
          {
            text: "OK",
            onPress: () => setMode("video"),
          },
        ]
      );
    }
  };

  const handleAnalysisConfirm = (analyzedExercises: WorkoutExercise[]) => {
    setExercises(analyzedExercises);
    setMode("manual");
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
            setMode("manual");
            setAnalysisResults([]);
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

  // Show video upload mode
  if (mode === "video") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {user && (
          <WorkoutVideoUploadMode
            userId={user.user_id}
            onVideosUploaded={handleVideosUploaded}
            onCancel={() => setMode("manual")}
          />
        )}
      </SafeAreaView>
    );
  }

  // Show analysis results
  if (mode === "analyzing" || mode === "results") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <WorkoutAnalysisResults
          results={analysisResults}
          onConfirm={handleAnalysisConfirm}
          onRetry={() => setMode("video")}
          isAnalyzing={mode === "analyzing"}
        />
      </SafeAreaView>
    );
  }

  // Manual entry mode
  if (mode === "manual") {
    // Store current mode to prevent type narrowing
    const currentMode = mode as WorkoutMode;

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
                Choose how you want to record your workout
              </Text>
            </View>

            {/* Mode Selection */}
            <WorkoutModeSelector
              currentMode={currentMode}
              onModeChange={setMode}
              showSelector={exercises.length === 0}
            />

            {/* Workout Title */}
            <WorkoutTitleInput
              title={workoutTitle}
              onTitleChange={setWorkoutTitle}
            />

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
            <WorkoutExerciseList
              exercises={exercises}
              selectedForSuperset={selectedForSuperset}
              onExerciseUpdate={handleExerciseUpdate}
              onExerciseRemove={handleExerciseRemove}
              onToggleSelection={toggleExerciseSelection}
              onCreateSuperset={createSuperset}
              onRemoveFromSuperset={removeFromSuperset}
            />

            {/* Save Button */}
            <WorkoutSaveButton
              onSave={handleSaveWorkout}
              isSaving={isSaving}
              disabled={isSaving || exercises.length === 0}
            />

            {/* Bottom Spacing */}
            <View className="h-8" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Fallback (should never reach here)
  return null;
};

export default ManualWorkoutForm;

