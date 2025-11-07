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
    <View className="bg-white rounded-3xl shadow-sm p-5 mt-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-gray-900">
          Workout Description
        </Text>
        <TouchableOpacity
          onPress={handleCopy}
          className="flex-row items-center bg-gray-100 rounded-full px-3 py-1.5"
          accessibilityLabel="Copy workout details"
        >
          <Ionicons
            name={copied ? "checkmark" : "copy"}
            size={16}
            color={copied ? "#16a34a" : "#111827"}
          />
          <Text
            className={`ml-2 text-sm font-medium ${
              copied ? "text-green-600" : "text-gray-800"
            }`}
          >
            {copied ? "Copied" : "Copy"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text className="text-gray-600 mt-3 leading-6">
        {description?.trim() ||
          "Preview the structure for today’s session including sets, supersets, and focus cues."}
      </Text>
    </View>
  );
};

export default PlanWorkoutDescriptionCard;
