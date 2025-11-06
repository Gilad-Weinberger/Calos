import React from "react";
import { Text, View } from "react-native";

interface VideoItem {
  uri: string;
  uploading: boolean;
  uploadedUrl?: string;
  error?: string;
  size?: number;
  compressing?: boolean;
}

interface VideoUploadProgressProps {
  videos: VideoItem[];
  isUploading: boolean;
}

const VideoUploadProgress: React.FC<VideoUploadProgressProps> = ({
  videos,
  isUploading,
}) => {
  if (!isUploading) {
    return null;
  }

  const uploadedCount = videos.filter((v) => v.uploadedUrl).length;
  const totalCount = videos.length;
  const progress = totalCount > 0 ? (uploadedCount / totalCount) * 100 : 0;

  return (
    <View className="bg-blue-50 rounded-lg p-4 mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-base font-semibold text-blue-900">
          Uploading Videos
        </Text>
        <Text className="text-sm text-blue-700">
          {uploadedCount}/{totalCount}
        </Text>
      </View>
      <View className="bg-blue-200 h-2 rounded-full overflow-hidden">
        <View
          className="bg-blue-600 h-full"
          style={{
            width: `${progress}%`,
          }}
        />
      </View>
    </View>
  );
};

export default VideoUploadProgress;

