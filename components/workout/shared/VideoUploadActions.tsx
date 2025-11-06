import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface VideoUploadActionsProps {
  onCancel: () => void;
  onUpload: () => void;
  isUploading: boolean;
  hasVideos: boolean;
}

const VideoUploadActions: React.FC<VideoUploadActionsProps> = ({
  onCancel,
  onUpload,
  isUploading,
  hasVideos,
}) => {
  return (
    <View className="p-4 bg-white border-t border-gray-200">
      <View className="flex-row space-x-3">
        <TouchableOpacity
          onPress={onCancel}
          disabled={isUploading}
          className={`flex-1 rounded-lg py-4 px-6 border border-gray-300 ${
            isUploading ? "opacity-50" : ""
          }`}
        >
          <Text className="text-center font-semibold text-base text-gray-700">
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onUpload}
          disabled={isUploading || !hasVideos}
          className={`flex-1 rounded-lg py-4 px-6 ${
            isUploading || !hasVideos ? "bg-gray-300" : "bg-blue-600"
          }`}
        >
          <Text
            className={`text-center font-semibold text-base ${
              isUploading || !hasVideos ? "text-gray-500" : "text-white"
            }`}
          >
            {isUploading ? "Uploading..." : "Upload & Analyze"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default VideoUploadActions;

