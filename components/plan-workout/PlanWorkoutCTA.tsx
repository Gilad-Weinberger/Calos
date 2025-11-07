import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={onStart}
      disabled={disabled}
      className={`absolute left-4 right-4 rounded-3xl py-4 flex-row items-center justify-center ${
        disabled ? "bg-gray-300" : "bg-black"
      }`}
      style={{
        bottom: insets.bottom + 16,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 16,
      }}
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
  );
};

export default PlanWorkoutCTA;
