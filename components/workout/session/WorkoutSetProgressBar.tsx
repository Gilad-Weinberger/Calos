import React from "react";
import { Text, View } from "react-native";

interface WorkoutSetProgressBarProps {
  currentSetIndex: number;
  totalSets: number;
}

const WorkoutSetProgressBar: React.FC<WorkoutSetProgressBarProps> = ({
  currentSetIndex,
  totalSets,
}) => {
  return (
    <>
      {/* Set Progress */}
      <View className="flex-row items-center mb-4">
        {Array.from({ length: totalSets }).map((_, index) => (
          <View
            key={index}
            className={`h-2 flex-1 rounded-full mx-1 ${
              index < currentSetIndex
                ? "bg-green-500"
                : index === currentSetIndex
                  ? "bg-blue-600"
                  : "bg-gray-200"
            }`}
          />
        ))}
      </View>

      <Text className="text-lg text-gray-700">
        Set {currentSetIndex + 1} of {totalSets}
      </Text>
    </>
  );
};

export default WorkoutSetProgressBar;

