import React from "react";
import { Text, TextInput, View } from "react-native";
import { ExerciseDefinition } from "../../../lib/functions/planFunctions";

interface DynamicExerciseInputProps {
  currentExercise: ExerciseDefinition;
  currentRepInput: string;
  onRepInputChange: (value: string) => void;
}

const DynamicExerciseInput: React.FC<DynamicExerciseInputProps> = ({
  currentExercise,
  currentRepInput,
  onRepInputChange,
}) => {
  return (
    <View className="mb-8">
      <Text className="text-base text-gray-700 mb-3">
        How many reps did you complete?
      </Text>

      <View className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
        <TextInput
          value={currentRepInput}
          onChangeText={onRepInputChange}
          keyboardType="numeric"
          placeholder={currentExercise.reps?.toString() || "0"}
          className="text-6xl font-bold text-center text-gray-900"
          maxLength={3}
          autoFocus
        />
        <Text className="text-center text-gray-600 mt-2">
          reps (target: {currentExercise.reps})
        </Text>
      </View>
    </View>
  );
};

export default DynamicExerciseInput;
