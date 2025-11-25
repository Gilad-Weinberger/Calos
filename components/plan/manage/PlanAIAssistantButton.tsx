import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface PlanAIAssistantButtonProps {
  onPress: () => void;
}

const PlanAIAssistantButton = ({ onPress }: PlanAIAssistantButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute bottom-20 right-6 bg-blue-600 rounded-full w-14 h-14 items-center justify-center"
      style={{
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
      }}
      activeOpacity={0.8}
    >
      <View className="items-center justify-center">
        <Ionicons name="sparkles" size={28} color="white" />
      </View>
    </TouchableOpacity>
  );
};

export default PlanAIAssistantButton;
