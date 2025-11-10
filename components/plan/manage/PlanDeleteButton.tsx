import React from "react";
import { Alert, Text, TouchableOpacity } from "react-native";

interface PlanDeleteButtonProps {
  onDelete: () => void;
  disabled?: boolean;
}

const PlanDeleteButton: React.FC<PlanDeleteButtonProps> = ({
  onDelete,
  disabled = false,
}) => {
  const handlePress = () => {
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
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      className={`w-full py-4 rounded-lg mt-6 mb-8 ${
        disabled ? "bg-gray-300" : "bg-red-500"
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
      <Text className="text-white font-semibold text-lg text-center">
        Delete Plan
      </Text>
    </TouchableOpacity>
  );
};

export default PlanDeleteButton;

