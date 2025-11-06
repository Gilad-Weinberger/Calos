import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface WorkoutCardStatsProps {
  totalExercises: number;
  totalSets: number;
  durationText: string | null;
  achievementCount: number;
}

const WorkoutCardStats: React.FC<WorkoutCardStatsProps> = ({
  totalExercises,
  totalSets,
  durationText,
  achievementCount,
}) => {
  return (
    <View className="flex-row justify-between mb-4 mt-4">
      <View className="flex-1">
        <Text className="text-sm text-gray-500 mb-1">Exercises</Text>
        <Text className="text-lg font-semibold text-gray-800">
          {totalExercises}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm text-gray-500 mb-1">Total Sets</Text>
        <Text className="text-lg font-semibold text-gray-800">{totalSets}</Text>
      </View>
      {durationText && (
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Duration</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {durationText}
          </Text>
        </View>
      )}
      {achievementCount > 0 && (
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Achievements</Text>
          <View className="flex-row items-center">
            <Ionicons name="trophy" size={18} color="#F59E0B" />
            <Text className="text-lg font-semibold text-gray-800 ml-1">
              {achievementCount}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default WorkoutCardStats;


