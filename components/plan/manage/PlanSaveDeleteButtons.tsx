import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PlanSaveDeleteButtonsProps {
  onSave: () => void;
  onDelete: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  hasUnsavedChanges?: boolean;
}

const PlanSaveDeleteButtons: React.FC<PlanSaveDeleteButtonsProps> = ({
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  hasUnsavedChanges = false,
}) => {
  const handleDeletePress = () => {
    Alert.alert(
      "Delete Plan",
      "Are you sure you want to delete this plan? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ]
    );
  };

  return (
    <View className="flex-row items-center mb-4">
      {/* Delete Icon Button */}
      <TouchableOpacity
        onPress={handleDeletePress}
        disabled={isDeleting}
        className={`p-4 rounded-lg mr-3 ${
          isDeleting ? "bg-gray-300" : "bg-red-500"
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="trash-outline" size={24} color="white" />
        )}
      </TouchableOpacity>

      {/* Save Button */}
      <TouchableOpacity
        onPress={onSave}
        disabled={isSaving || !hasUnsavedChanges}
        className={`flex-1 py-4 rounded-lg ${
          isSaving || !hasUnsavedChanges ? "bg-gray-300" : "bg-blue-600"
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {isSaving ? (
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="white" />
            <Text className="text-white font-semibold text-lg ml-2">
              Saving...
            </Text>
          </View>
        ) : (
          <Text className="text-white font-semibold text-lg text-center">
            Save Changes
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default PlanSaveDeleteButtons;
