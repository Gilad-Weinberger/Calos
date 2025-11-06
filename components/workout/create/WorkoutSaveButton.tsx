import React from "react";
import { Text, TouchableOpacity } from "react-native";

interface WorkoutSaveButtonProps {
  onSave: () => void;
  isSaving: boolean;
  disabled: boolean;
}

const WorkoutSaveButton: React.FC<WorkoutSaveButtonProps> = ({
  onSave,
  isSaving,
  disabled,
}) => {
  return (
    <TouchableOpacity
      onPress={onSave}
      disabled={disabled}
      className={`rounded-lg py-4 px-6 ${
        disabled ? "bg-gray-300" : "bg-blue-600"
      }`}
    >
      <Text
        className={`text-center font-semibold text-base ${
          disabled ? "text-gray-500" : "text-white"
        }`}
      >
        {isSaving ? "Saving..." : "Save Workout"}
      </Text>
    </TouchableOpacity>
  );
};

export default WorkoutSaveButton;


