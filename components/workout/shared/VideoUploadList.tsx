import React from "react";
import { Text, View } from "react-native";
import VideoUploadItem from "./VideoUploadItem";

interface VideoItem {
  uri: string;
  uploading: boolean;
  uploadedUrl?: string;
  error?: string;
  size?: number;
  compressing?: boolean;
}

interface VideoUploadListProps {
  videos: VideoItem[];
  onRemove: (index: number) => void;
  formatFileSize: (bytes: number) => string;
  warningSizeBytes: number;
}

const VideoUploadList: React.FC<VideoUploadListProps> = ({
  videos,
  onRemove,
  formatFileSize,
  warningSizeBytes,
}) => {
  if (videos.length === 0) {
    return null;
  }

  return (
    <View className="mb-4">
      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Selected Videos ({videos.length})
      </Text>

      {videos.map((video, index) => (
        <VideoUploadItem
          key={index}
          video={video}
          index={index}
          onRemove={() => onRemove(index)}
          formatFileSize={formatFileSize}
          warningSizeBytes={warningSizeBytes}
        />
      ))}
    </View>
  );
};

export default VideoUploadList;


