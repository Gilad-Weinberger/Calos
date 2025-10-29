import React from "react";
import { Text, View } from "react-native";

interface WorkoutStatsSummaryProps {
  totalSets: number;
  totalReps: number;
  duration: number; // in minutes
}

const WorkoutStatsSummary: React.FC<WorkoutStatsSummaryProps> = ({
  totalSets,
  totalReps,
  duration,
}) => {
  return (
    <View className="bg-white rounded-lg p-4 border border-gray-200">
      <Text className="text-base font-medium text-gray-900 mb-3">
        Workout Summary
      </Text>
      <View className="flex-row justify-between">
        <View className="items-center">
          <Text className="text-2xl font-bold text-blue-600">{totalSets}</Text>
          <Text className="text-sm text-gray-600">Total Sets</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-green-600">{totalReps}</Text>
          <Text className="text-sm text-gray-600">Total Reps</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-purple-600">
            {duration ? `${Math.floor(duration / 60)}m` : "N/A"}
          </Text>
          <Text className="text-sm text-gray-600">Duration</Text>
        </View>
      </View>
    </View>
  );
};

export default WorkoutStatsSummary;
