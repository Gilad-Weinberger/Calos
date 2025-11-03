import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface PlanEditActionsProps {
  mode: "validation" | "edit";
  onSave: () => void;
  onSecondaryAction: () => void; // Discard in validation mode, Cancel in edit mode
  isSaving: boolean;
  isProcessing: boolean;
}

const PlanEditActions: React.FC<PlanEditActionsProps> = ({
  mode,
  onSave,
  onSecondaryAction,
  isSaving,
  isProcessing,
}) => {
  const secondaryButtonText = mode === "validation" ? "Discard" : "Cancel";
  const saveButtonText = mode === "validation" ? "Save Plan" : "Save Changes";

  return (
    <View className="bg-white border-t border-gray-200 p-4">
      <View className="flex-row space-x-3">
        {/* Secondary Action Button (Discard/Cancel) */}
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg ${
            mode === "validation" ? "bg-red-500" : "bg-gray-500"
          }`}
          onPress={onSecondaryAction}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-medium text-center">
              {secondaryButtonText}
            </Text>
          )}
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          className="flex-1 bg-blue-500 py-3 rounded-lg"
          onPress={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-medium text-center">
              {saveButtonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PlanEditActions;

