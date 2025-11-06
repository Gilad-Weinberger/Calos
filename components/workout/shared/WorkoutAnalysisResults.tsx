import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { VideoAnalysisResult } from "../../../lib/functions/videoFunctions";
import { WorkoutExercise } from "../../../lib/functions/workoutFunctions";

interface WorkoutAnalysisResultsProps {
  results: VideoAnalysisResult[];
  onConfirm: (exercises: WorkoutExercise[]) => void;
  onRetry: () => void;
  isAnalyzing: boolean;
}

const WorkoutAnalysisResults: React.FC<WorkoutAnalysisResultsProps> = ({
  results,
  onConfirm,
  onRetry,
  isAnalyzing,
}) => {
  const [exercises, setExercises] = React.useState<WorkoutExercise[]>([]);

  React.useEffect(() => {
    // Convert analysis results to WorkoutExercise format
    const workoutExercises: WorkoutExercise[] = results.map(
      (result, index) => ({
        exercise_id: result.exercise_id,
        exercise_name: result.exercise_name,
        exercise_type: result.exercise_type,
        sets: result.sets,
        reps: result.reps,
        order_index: index + 1,
        video_urls: result.video_urls,
        analysis_metadata: {
          confidence: result.confidence,
          analyzed_at: new Date().toISOString(),
        },
      })
    );
    setExercises(workoutExercises);
  }, [results]);

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((ex, i) => ({ ...ex, order_index: i + 1 }))
    );
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  if (isAnalyzing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <View className="bg-white rounded-lg p-6 items-center">
          <View className="mb-4">
            <Ionicons name="analytics-outline" size={64} color="#3b82f6" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            Analyzing Videos
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Our AI is detecting exercises and counting reps. This may take a
            moment...
          </Text>
        </View>
      </View>
    );
  }

  if (!results || results.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <View className="bg-white rounded-lg p-6 items-center">
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">
            No Exercises Detected
          </Text>
          <Text className="text-base text-gray-600 text-center mb-6">
            We couldn&apos;t detect any exercises in your videos. Please try
            again with clearer videos.
          </Text>
          <TouchableOpacity
            onPress={onRetry}
            className="bg-blue-600 rounded-lg py-3 px-6"
          >
            <Text className="text-white font-semibold text-base">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center mb-2">
            <Ionicons name="checkmark-circle" size={28} color="#10b981" />
            <Text className="text-2xl font-bold text-gray-900 ml-2">
              Analysis Complete
            </Text>
          </View>
          <Text className="text-base text-gray-600">
            Review the detected exercises below. You can edit the sets and reps
            before saving.
          </Text>
        </View>

        {/* Results */}
        {exercises.map((exercise, index) => {
          const result = results[index];
          return (
            <View
              key={index}
              className="bg-white rounded-lg p-4 mb-4 border border-gray-200"
            >
              {/* Exercise Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900">
                    {exercise.exercise_name}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View className="bg-blue-100 rounded px-2 py-1 mr-2">
                      <Text className="text-xs font-medium text-blue-700">
                        {exercise.exercise_type === "dynamic"
                          ? "Dynamic"
                          : "Static"}
                      </Text>
                    </View>
                    {result && (
                      <View className="flex-row items-center">
                        <Ionicons
                          name="stats-chart"
                          size={12}
                          color={
                            result.confidence >= 0.8 ? "#10b981" : "#f59e0b"
                          }
                        />
                        <Text
                          className={`text-xs font-medium ml-1 ${getConfidenceColor(
                            result.confidence
                          )}`}
                        >
                          {getConfidenceText(result.confidence)} confidence
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveExercise(index)}
                  className="p-2"
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {/* Video Count */}
              {result && result.video_urls.length > 0 && (
                <View className="flex-row items-center mb-3">
                  <Ionicons name="videocam" size={16} color="#6b7280" />
                  <Text className="text-sm text-gray-600 ml-1">
                    {result.video_urls.length}{" "}
                    {result.video_urls.length === 1 ? "video" : "videos"}
                  </Text>
                </View>
              )}

              {/* Sets and Reps Info */}
              <View className="bg-gray-50 rounded-lg p-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-gray-700">
                    Sets
                  </Text>
                  <Text className="text-base font-bold text-gray-900">
                    {exercise.sets}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-gray-700">
                    {exercise.exercise_type === "dynamic"
                      ? "Reps per set"
                      : "Duration per set (seconds)"}
                  </Text>
                  <Text className="text-base font-bold text-gray-900">
                    {exercise.reps.join(", ")}
                  </Text>
                </View>
              </View>

              {/* Total */}
              <View className="mt-3 pt-3 border-t border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-gray-700">
                    Total{" "}
                    {exercise.exercise_type === "dynamic" ? "Reps" : "Time"}
                  </Text>
                  <Text className="text-lg font-bold text-blue-600">
                    {exercise.reps.reduce((sum, rep) => sum + rep, 0)}
                    {exercise.exercise_type === "static" ? "s" : ""}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Info Note */}
        <View className="bg-blue-50 rounded-lg p-4 mb-4">
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle"
              size={20}
              color="#3b82f6"
              style={{ marginTop: 2 }}
            />
            <Text className="text-sm text-blue-900 ml-2 flex-1">
              You can edit the exercises, sets, and reps after saving the
              workout by tapping the menu on the workout card.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 bg-white border-t border-gray-200">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={onRetry}
            className="flex-1 rounded-lg py-4 px-6 border border-gray-300"
          >
            <Text className="text-center font-semibold text-base text-gray-700">
              Upload More Videos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onConfirm(exercises)}
            disabled={exercises.length === 0}
            className={`flex-1 rounded-lg py-4 px-6 ${
              exercises.length === 0 ? "bg-gray-300" : "bg-blue-600"
            }`}
          >
            <Text
              className={`text-center font-semibold text-base ${
                exercises.length === 0 ? "text-gray-500" : "text-white"
              }`}
            >
              Save Workout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default WorkoutAnalysisResults;

