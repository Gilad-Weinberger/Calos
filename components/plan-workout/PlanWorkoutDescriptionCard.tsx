import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PlanWorkoutDescriptionCardProps {
  description?: string | null;
  copyText: string;
}

const PlanWorkoutDescriptionCard: React.FC<PlanWorkoutDescriptionCardProps> = ({
  description,
  copyText,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying workout summary:", error);
    }
  };

  return (
    <View className="mt-6 flex-row items-center px-2 py-1.5">
      <TouchableOpacity
        onPress={handleCopy}
        className=""
        accessibilityLabel="Copy workout details"
      >
        <Ionicons
          name={copied ? "copy" : "copy-outline"}
          size={18}
          color={"#111827"}
        />
      </TouchableOpacity>
      <Text className="text-lg font-semibold text-gray-900 ml-2">
        Description
      </Text>
    </View>
  );
};

export default PlanWorkoutDescriptionCard;
