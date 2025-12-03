import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { ExerciseDefinition } from "../../../../lib/functions/planFunctions";

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
  const handleIncrement = () => {
    const currentVal = parseInt(currentRepInput) || 0;
    onRepInputChange((currentVal + 1).toString());
  };

  const handleDecrement = () => {
    const currentVal = parseInt(currentRepInput) || 0;
    if (currentVal > 0) {
      onRepInputChange((currentVal - 1).toString());
    }
  };

  return (
    <View className="mb-8">
      <Text className="text-base text-gray-700 mb-3">
        How many reps did you complete?
      </Text>

      <View className="flex-row items-center bg-gray-50 rounded-lg border-2 border-gray-200">
        <TouchableOpacity
          onPress={handleDecrement}
          className="p-6 border-r border-gray-200"
        >
          <Ionicons name="chevron-down" size={32} color="#4b5563" />
        </TouchableOpacity>

        <View className="flex-1 py-6">
          <TextInput
            value={currentRepInput}
            onChangeText={onRepInputChange}
            keyboardType="numeric"
            className="text-6xl font-bold text-center text-gray-900"
            maxLength={3}
          />
          <Text className="text-center text-gray-600 mt-2">
            reps (target: {currentExercise.reps})
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleIncrement}
          className="p-6 border-l border-gray-200"
        >
          <Ionicons name="chevron-up" size={32} color="#4b5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DynamicExerciseInput;
