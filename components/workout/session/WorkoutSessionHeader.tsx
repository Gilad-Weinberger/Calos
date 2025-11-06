import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface WorkoutSessionHeaderProps {
  onExit: () => void;
  elapsedTime: string;
  currentExerciseIndex: number;
  totalExercises: number;
}

const WorkoutSessionHeader: React.FC<WorkoutSessionHeaderProps> = ({
  onExit,
  elapsedTime,
  currentExerciseIndex,
  totalExercises,
}) => {
  return (
    <View className="px-4 py-3 border-b border-gray-200">
      <View className="flex-row items-center justify-between">
        {/* Exit Button */}
        <TouchableOpacity onPress={onExit} className="p-2">
          <Ionicons name="close" size={28} color="#ef4444" />
        </TouchableOpacity>

        {/* Stopwatch */}
        <View className="flex-row items-center bg-gray-100 px-4 py-2 rounded-lg">
          <Ionicons name="time" size={20} color="#2563eb" />
          <Text className="text-lg font-bold text-gray-900 ml-2">
            {elapsedTime}
          </Text>
        </View>

        {/* Progress */}
        <View className="bg-blue-100 px-3 py-2 rounded-lg">
          <Text className="text-sm font-semibold text-blue-700">
            {currentExerciseIndex + 1}/{totalExercises}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default WorkoutSessionHeader;


