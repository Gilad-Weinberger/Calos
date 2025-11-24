import { Ionicons } from "@expo/vector-icons";
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
      <View className="flex-row gap-3">
        {/* Delete Button - Icon Only */}
        <TouchableOpacity
          className="bg-red-500 w-12 h-12 rounded-lg items-center justify-center"
          onPress={onDiscard}
          disabled={isDiscarding}
          style={{
            opacity: isDiscarding ? 0.5 : 1,
          }}
        >
          {isDiscarding ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="trash-outline" size={24} color="white" />
          )}
        </TouchableOpacity>

        {/* Save Button - Takes Most Width */}
        <TouchableOpacity
          className="flex-1 bg-blue-600 py-3 rounded-lg"
          onPress={onSave}
          disabled={isSaving}
          style={{
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white font-semibold text-base ml-2">
                Saving...
              </Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-base text-center">
              Save Workout
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WorkoutEditActionButtons;
