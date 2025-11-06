import React from "react";
import { Text, View } from "react-native";
import { ExerciseDefinition } from "../../../../lib/functions/planFunctions";

interface StaticExerciseInputProps {
  currentExercise: ExerciseDefinition;
}

const StaticExerciseInput: React.FC<StaticExerciseInputProps> = ({
  currentExercise,
}) => {
  return (
    <View className="mb-8">
      <Text className="text-base text-gray-700 mb-3">
        Hold for {currentExercise.duration} seconds
      </Text>

      <View className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
        <Text className="text-6xl font-bold text-center text-gray-900">
          {currentExercise.duration}
        </Text>
        <Text className="text-center text-gray-600 mt-2">
          seconds
        </Text>
      </View>
    </View>
  );
};

export default StaticExerciseInput;

