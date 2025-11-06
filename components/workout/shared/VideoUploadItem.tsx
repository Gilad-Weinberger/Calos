import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface VideoItem {
  uri: string;
  uploading: boolean;
  uploadedUrl?: string;
  error?: string;
  size?: number;
  compressing?: boolean;
}

interface VideoUploadItemProps {
  video: VideoItem;
  index: number;
  onRemove: () => void;
  formatFileSize: (bytes: number) => string;
  warningSizeBytes: number;
}

const VideoUploadItem: React.FC<VideoUploadItemProps> = ({
  video,
  index,
  onRemove,
  formatFileSize,
  warningSizeBytes,
}) => {
  return (
    <View className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
      <View className="flex-row items-center">
        {/* Video Thumbnail */}
        <View className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden mr-3">
          <Video
            source={{ uri: video.uri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            useNativeControls={false}
          />
        </View>

        {/* Video Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-medium text-gray-900">
              Video {index + 1}
            </Text>
            {video.size && (
              <View className="flex-row items-center">
                {video.size > warningSizeBytes && (
                  <Ionicons
                    name="warning"
                    size={14}
                    color="#f59e0b"
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  className={`text-xs font-medium ${
                    video.size > warningSizeBytes
                      ? "text-amber-600"
                      : "text-gray-600"
                  }`}
                >
                  {formatFileSize(video.size)}
                </Text>
              </View>
            )}
          </View>

          {video.compressing && (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text className="text-sm text-purple-600 ml-2">
                Compressing...
              </Text>
            </View>
          )}

          {video.uploading && !video.compressing && (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text className="text-sm text-blue-600 ml-2">Uploading...</Text>
            </View>
          )}

          {video.uploadedUrl && (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-sm text-green-600 ml-2">Uploaded</Text>
            </View>
          )}

          {video.error && (
            <View className="flex-row items-center">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-sm text-red-600 ml-2">{video.error}</Text>
            </View>
          )}

          {!video.uploading &&
            !video.uploadedUrl &&
            !video.error &&
            !video.compressing && (
              <Text className="text-sm text-gray-500">Ready to upload</Text>
            )}
        </View>

        {/* Remove Button */}
        {!video.uploading && (
          <TouchableOpacity onPress={onRemove} className="p-2">
            <Ionicons name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default VideoUploadItem;


