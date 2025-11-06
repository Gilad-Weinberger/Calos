import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface WorkoutEditActionButtonsProps {
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  isDiscarding: boolean;
}

const WorkoutEditActionButtons: React.FC<WorkoutEditActionButtonsProps> = ({
  onSave,
  onDiscard,
  isSaving,
  isDiscarding,
}) => {
  return (
    <View className="bg-white border-t border-gray-200 p-4">
      <View className="flex-row space-x-3">
        <TouchableOpacity
          className="flex-1 bg-red-500 py-3 rounded-lg"
          onPress={onDiscard}
          disabled={isDiscarding}
        >
          {isDiscarding ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-medium text-center">Discard</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-blue-500 py-3 rounded-lg"
          onPress={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-medium text-center">
              Save Workout
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WorkoutEditActionButtons;

