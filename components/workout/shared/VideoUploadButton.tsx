import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface VideoUploadButtonProps {
  onPress: () => void;
  disabled: boolean;
}

const VideoUploadButton: React.FC<VideoUploadButtonProps> = ({
  onPress,
  disabled,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`border-2 border-dashed border-blue-400 rounded-lg p-6 mb-4 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <View className="items-center">
        <Ionicons name="cloud-upload-outline" size={48} color="#3b82f6" />
        <Text className="text-blue-600 font-semibold text-base mt-2">
          Add Videos
        </Text>
        <Text className="text-gray-500 text-sm mt-1">
          Tap to select from gallery
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default VideoUploadButton;


