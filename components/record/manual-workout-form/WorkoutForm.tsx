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
import AnalysisResults from "../shared/AnalysisResults";
import VideoUploadMode from "../shared/VideoUploadMode";
import ExerciseSelector from "./ExerciseSelector";
import ExerciseSetInput from "./ExerciseSetInput";

type WorkoutMode = "manual" | "video" | "analyzing" | "results";

const WorkoutForm: React.FC = () => {
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
          <VideoUploadMode
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
        <AnalysisResults
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
            {exercises.length === 0 && (
              <View className="mb-6">
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={() => setMode("manual")}
                    className={`flex-1 rounded-lg p-4 border-2 ${
                      currentMode === "manual"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <View className="items-center">
                      <Ionicons
                        name="create-outline"
                        size={32}
                        color={currentMode === "manual" ? "#2563eb" : "#6b7280"}
                      />
                      <Text
                        className={`text-base font-semibold mt-2 ${
                          currentMode === "manual"
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        Manual Entry
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setMode("video")}
                    className={`flex-1 rounded-lg p-4 border-2 ${
                      currentMode === "video"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <View className="items-center">
                      <Ionicons
                        name="videocam-outline"
                        size={32}
                        color={currentMode === "video" ? "#2563eb" : "#6b7280"}
                      />
                      <Text
                        className={`text-base font-semibold mt-2 ${
                          currentMode === "video"
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        Video Upload
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

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
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-medium text-gray-700">
                    Exercises ({exercises.length})
                  </Text>
                  {selectedForSuperset.length > 0 && (
                    <TouchableOpacity
                      onPress={createSuperset}
                      className="bg-blue-600 rounded-lg px-3 py-2"
                    >
                      <Text className="text-white text-xs font-semibold">
                        Create Superset ({selectedForSuperset.length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {exercises.map((exercise, index) => (
                  <View key={`${exercise.exercise_id}-${index}`}>
                    {/* Superset Indicator */}
                    {exercise.superset_group && (
                      <View className="bg-blue-50 border-l-4 border-blue-500 px-3 py-1 mb-1">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-xs font-bold text-blue-600">
                            SUPERSET {exercise.superset_group}
                          </Text>
                          <TouchableOpacity
                            onPress={() => removeFromSuperset(index)}
                          >
                            <Text className="text-xs text-blue-600 underline">
                              Remove from superset
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <View className="flex-row items-center">
                      {/* Selection Checkbox */}
                      {!exercise.superset_group && (
                        <TouchableOpacity
                          onPress={() => toggleExerciseSelection(index)}
                          className="mr-2"
                        >
                          <View
                            className={`w-6 h-6 border-2 rounded items-center justify-center ${
                              selectedForSuperset.includes(index)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }`}
                          >
                            {selectedForSuperset.includes(index) && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="white"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      )}

                      <View className="flex-1">
                        <ExerciseSetInput
                          exercise={exercise}
                          onUpdate={(updatedExercise) =>
                            handleExerciseUpdate(index, updatedExercise)
                          }
                          onRemove={() => handleExerciseRemove(index)}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                {/* Instructions */}
                {exercises.length >= 2 && selectedForSuperset.length === 0 && (
                  <View className="bg-gray-100 rounded-lg p-3 mt-2">
                    <Text className="text-xs text-gray-600">
                      💡 Tip: Select 2 or more exercises using the checkboxes to
                      create a superset (exercises performed back-to-back
                      without rest)
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSaveWorkout}
              disabled={isSaving || exercises.length === 0}
              className={`rounded-lg py-4 px-6 ${
                isSaving || exercises.length === 0
                  ? "bg-gray-300"
                  : "bg-blue-600"
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
  }

  // Fallback (should never reach here)
  return null;
};

export default WorkoutForm;
