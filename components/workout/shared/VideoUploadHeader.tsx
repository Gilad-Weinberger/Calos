import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

const VideoUploadHeader: React.FC = () => {
  return (
    <View className="mb-6">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        Upload Workout Videos
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Select videos of your exercises. We will automatically compress and
        analyze them to detect exercises and count reps. Videos must be under
        20MB after compression.
      </Text>
      <View className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <View className="flex-row items-start">
          <Ionicons name="information-circle" size={18} color="#3b82f6" />
          <View className="flex-1 ml-2">
            <Text className="text-sm text-blue-900 font-medium mb-1">
              Tips for best results:
            </Text>
            <Text className="text-xs text-blue-800">
              • Videos are automatically compressed before upload
              {"\n"}• Compressed videos must be under 20MB for AI analysis
              {"\n"}• Ensure good lighting and clear view of exercise
              {"\n"}• Shorter clips (10-30 seconds) work best
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default VideoUploadHeader;


