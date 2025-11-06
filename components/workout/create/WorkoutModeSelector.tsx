import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type WorkoutMode = "manual" | "video";

interface WorkoutModeSelectorProps {
  currentMode: WorkoutMode;
  onModeChange: (mode: WorkoutMode) => void;
  showSelector: boolean;
}

const WorkoutModeSelector: React.FC<WorkoutModeSelectorProps> = ({
  currentMode,
  onModeChange,
  showSelector,
}) => {
  if (!showSelector) {
    return null;
  }

  return (
    <View className="mb-6">
      <View className="flex-row space-x-3">
        <TouchableOpacity
          onPress={() => onModeChange("manual")}
          className={`flex-1 rounded-lg p-4 border-2 ${
            currentMode === "manual"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 bg-white"
          }`}
        >
          <View className="items-center">
            <Ionicons
              name="create-outline"
              size={32}
              color={currentMode === "manual" ? "#2563eb" : "#6b7280"}
            />
            <Text
              className={`text-base font-semibold mt-2 ${
                currentMode === "manual"
                  ? "text-blue-600"
                  : "text-gray-700"
              }`}
            >
              Manual Entry
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onModeChange("video")}
          className={`flex-1 rounded-lg p-4 border-2 ${
            currentMode === "video"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-300 bg-white"
          }`}
        >
          <View className="items-center">
            <Ionicons
              name="videocam-outline"
              size={32}
              color={currentMode === "video" ? "#2563eb" : "#6b7280"}
            />
            <Text
              className={`text-base font-semibold mt-2 ${
                currentMode === "video" ? "text-blue-600" : "text-gray-700"
              }`}
            >
              Video Upload
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WorkoutModeSelector;


