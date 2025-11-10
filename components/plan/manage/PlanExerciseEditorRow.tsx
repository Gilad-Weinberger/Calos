import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import type { ExerciseDefinition } from "../../../lib/functions/planFunctions";

interface PlanExerciseEditorRowProps {
  exercise: ExerciseDefinition;
  exerciseName: string;
  exerciseType: "static" | "dynamic";
  onExerciseNamePress: () => void;
  onSetsChange: (sets: number) => void;
  onRepsChange: (reps: number | undefined) => void;
  onDurationChange: (duration: number | undefined) => void;
  onRestSecondsChange: (restSeconds: number) => void;
  onRemove: () => void;
  isInSuperset?: boolean;
  onRemoveFromSuperset?: () => void;
  onExerciseChange?: (exerciseId: string, exerciseName: string, exerciseType: "static" | "dynamic") => void;
}

const PlanExerciseEditorRow: React.FC<PlanExerciseEditorRowProps> = ({
  exercise,
  exerciseName,
  exerciseType,
  onExerciseNamePress,
  onSetsChange,
  onRepsChange,
  onDurationChange,
  onRestSecondsChange,
  onRemove,
  isInSuperset = false,
  onRemoveFromSuperset,
  onExerciseChange,
}) => {
  const isStatic = exerciseType === "static";

  return (
    <View className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
      {/* Exercise Name Row */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          onPress={onExerciseNamePress}
          className="flex-1 mr-2 bg-white rounded-lg px-4 py-3 border border-gray-300 flex-row items-center justify-between"
        >
          <Text className="text-base font-medium text-gray-900 flex-1">
            {exerciseName || "Select Exercise"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRemove}
          className="p-2 ml-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Superset Badge */}
      {isInSuperset && (
        <View className="flex-row items-center mb-3">
          <View className="bg-purple-100 px-3 py-1 rounded-full flex-row items-center">
            <Ionicons name="link" size={14} color="#9333EA" />
            <Text className="text-xs font-semibold text-purple-800 ml-1">
              Superset
            </Text>
          </View>
          {onRemoveFromSuperset && (
            <TouchableOpacity
              onPress={onRemoveFromSuperset}
              className="ml-2"
            >
              <Text className="text-xs text-purple-600">Remove from Superset</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Sets, Reps/Duration, Rest Inputs */}
      <View className="flex-row items-center space-x-2">
        {/* Sets */}
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-700 mb-1">Sets</Text>
          <TextInput
            value={exercise.sets.toString()}
            onChangeText={(text) => {
              const sets = parseInt(text, 10);
              if (!isNaN(sets) && sets > 0) {
                onSetsChange(sets);
              }
            }}
            keyboardType="number-pad"
            className="bg-white rounded-lg px-3 py-2 text-base text-gray-900 border border-gray-300"
            placeholder="0"
          />
        </View>

        {/* Reps or Duration */}
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-700 mb-1">
            {isStatic ? "Duration (sec)" : "Reps"}
          </Text>
          <TextInput
            value={
              isStatic
                ? (exercise.duration || "").toString()
                : (exercise.reps || "").toString()
            }
            onChangeText={(text) => {
              const value = parseInt(text, 10);
              if (!isNaN(value) && value > 0) {
                if (isStatic) {
                  onDurationChange(value);
                } else {
                  onRepsChange(value);
                }
              } else if (text === "") {
                if (isStatic) {
                  onDurationChange(undefined);
                } else {
                  onRepsChange(undefined);
                }
              }
            }}
            keyboardType="number-pad"
            className="bg-white rounded-lg px-3 py-2 text-base text-gray-900 border border-gray-300"
            placeholder="0"
          />
        </View>

        {/* Rest Seconds */}
        <View className="flex-1">
          <Text className="text-xs font-medium text-gray-700 mb-1">
            Rest (sec)
          </Text>
          <TextInput
            value={exercise.rest_seconds.toString()}
            onChangeText={(text) => {
              const rest = parseInt(text, 10);
              if (!isNaN(rest) && rest >= 0) {
                onRestSecondsChange(rest);
              }
            }}
            keyboardType="number-pad"
            className="bg-white rounded-lg px-3 py-2 text-base text-gray-900 border border-gray-300"
            placeholder="0"
          />
        </View>
      </View>
    </View>
  );
};

export default PlanExerciseEditorRow;

