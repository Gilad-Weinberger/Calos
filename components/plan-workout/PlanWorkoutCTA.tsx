import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PlanWorkoutCTAProps {
  onStart: () => void;
  disabled?: boolean;
  label?: string;
}

const PlanWorkoutCTA: React.FC<PlanWorkoutCTAProps> = ({
  onStart,
  disabled = false,
  label = "Start Workout",
}) => {
  return (
    <View className="px-4 pb-8 pt-5 border-t border-gray-200 bg-white">
      <TouchableOpacity
        onPress={onStart}
        disabled={disabled}
        className={`w-full rounded-3xl py-4 flex-row items-center justify-center ${
          disabled ? "bg-gray-300" : "bg-black"
        }`}
      >
        <Ionicons
          name={disabled ? "checkmark" : "play"}
          size={20}
          color={disabled ? "#111827" : "white"}
        />
        <Text
          className={`ml-3 text-lg font-semibold ${
            disabled ? "text-gray-800" : "text-white"
          }`}
        >
          {disabled ? "Workout Completed" : label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PlanWorkoutCTA;

