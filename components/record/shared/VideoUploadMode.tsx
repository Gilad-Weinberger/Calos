import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Video as VideoCompressor } from "react-native-compressor";
import { uploadWorkoutVideo } from "../../../lib/functions/videoFunctions";

// Maximum video size (20MB for compressed videos)
const MAX_VIDEO_SIZE_BYTES = 20 * 1024 * 1024;
const WARNING_SIZE_BYTES = 8 * 1024 * 1024; // 8MB - show warning

interface VideoItem {
  uri: string;
  uploading: boolean;
  uploadedUrl?: string;
  error?: string;
  size?: number;
  compressing?: boolean;
}

/**
 * Formats bytes to human-readable size
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
};

interface VideoUploadModeProps {
  userId: string;
  onVideosUploaded: (videoUrls: string[]) => void;
  onCancel: () => void;
}

const VideoUploadMode: React.FC<VideoUploadModeProps> = ({
  userId,
  onVideosUploaded,
  onCancel,
}) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const pickVideos = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload videos."
        );
        return;
      }

      // Launch video picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsMultipleSelection: true,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets) {
        // Process and compress videos
        const newVideos: VideoItem[] = [];
        const oversizedVideos: string[] = [];

        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];

          try {
            // Get original file size
            let originalSize = 0;
            const originalInfo = await FileSystem.getInfoAsync(asset.uri);
            if (originalInfo.exists && "size" in originalInfo) {
              originalSize = originalInfo.size;
            }

            // Add video with compressing status
            const tempVideoIndex = videos.length + newVideos.length;
            const tempVideo: VideoItem = {
              uri: asset.uri,
              uploading: false,
              size: originalSize,
              compressing: true,
            };
            newVideos.push(tempVideo);
            setVideos((prev) => [...prev, ...newVideos]);

            console.log(
              `Compressing video ${i + 1}: Original size ${formatFileSize(originalSize)}`
            );

            // Compress the video
            const compressedUri = await VideoCompressor.compress(asset.uri, {
              compressionMethod: "auto",
            });

            // Get compressed file size
            const compressedInfo = await FileSystem.getInfoAsync(compressedUri);
            let compressedSize = 0;
            if (compressedInfo.exists && "size" in compressedInfo) {
              compressedSize = compressedInfo.size;
            }

            console.log(
              `Compressed video ${i + 1}: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)}`
            );

            // Check if compressed video is still too large
            if (compressedSize > MAX_VIDEO_SIZE_BYTES) {
              oversizedVideos.push(
                `Video ${i + 1}: ${formatFileSize(compressedSize)} after compression (limit: ${formatFileSize(MAX_VIDEO_SIZE_BYTES)})`
              );
              // Remove the video from the list
              newVideos.pop();
              setVideos((prev) => prev.slice(0, -1));
            } else {
              // Update with compressed video
              newVideos[newVideos.length - 1] = {
                uri: compressedUri,
                uploading: false,
                size: compressedSize,
                compressing: false,
              };
              setVideos((prev) => [
                ...prev.slice(0, tempVideoIndex),
                {
                  uri: compressedUri,
                  uploading: false,
                  size: compressedSize,
                  compressing: false,
                },
              ]);
            }
          } catch (error) {
            console.error(`Error processing video ${i + 1}:`, error);
            Alert.alert(
              "Compression Error",
              `Failed to compress video ${i + 1}. Please try a different video.`
            );
            // Remove the failed video
            if (newVideos.length > 0) {
              newVideos.pop();
              setVideos((prev) => prev.slice(0, -1));
            }
          }
        }

        // Show alert if some videos are still too large after compression
        if (oversizedVideos.length > 0) {
          Alert.alert(
            "Videos Still Too Large",
            `${oversizedVideos.length} video(s) exceed 20MB even after compression and were not added:\n\n${oversizedVideos.join("\n")}\n\nPlease record shorter clips.`,
            [{ text: "OK" }]
          );
        }

        // Success message if videos were successfully compressed
        if (newVideos.length > 0 && oversizedVideos.length === 0) {
          const totalOriginalSize = result.assets.reduce((sum, asset) => {
            return sum + (asset.fileSize || 0);
          }, 0);
          const totalCompressedSize = newVideos.reduce((sum, video) => {
            return sum + (video.size || 0);
          }, 0);

          if (
            totalOriginalSize > 0 &&
            totalCompressedSize < totalOriginalSize * 0.8
          ) {
            // Only show message if significant compression occurred (>20% reduction)
            console.log(
              `Compression saved ${formatFileSize(totalOriginalSize - totalCompressedSize)}`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error picking videos:", error);
      Alert.alert("Error", "Failed to select videos. Please try again.");
    }
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllVideos = async () => {
    if (videos.length === 0) {
      Alert.alert("No Videos", "Please select at least one video to upload.");
      return;
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // Upload videos one by one
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];

        if (video.uploadedUrl) {
          // Already uploaded
          uploadedUrls.push(video.uploadedUrl);
          continue;
        }

        // Update status to uploading
        setVideos((prev) =>
          prev.map((v, idx) => (idx === i ? { ...v, uploading: true } : v))
        );

        try {
          const uploadedUrl = await uploadWorkoutVideo(userId, video.uri);
          uploadedUrls.push(uploadedUrl);

          // Update with uploaded URL
          setVideos((prev) =>
            prev.map((v, idx) =>
              idx === i
                ? { ...v, uploading: false, uploadedUrl, error: undefined }
                : v
            )
          );
        } catch (error) {
          console.error(`Error uploading video ${i}:`, error);

          // Mark as error
          setVideos((prev) =>
            prev.map((v, idx) =>
              idx === i
                ? {
                    ...v,
                    uploading: false,
                    error: "Upload failed",
                  }
                : v
            )
          );
        }
      }

      if (uploadedUrls.length === 0) {
        Alert.alert("Upload Failed", "Failed to upload any videos.");
        setIsUploading(false);
        return;
      }

      // Notify parent component
      onVideosUploaded(uploadedUrls);
    } catch (error) {
      console.error("Error in uploadAllVideos:", error);
      Alert.alert("Error", "Failed to upload videos. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getUploadProgress = () => {
    const uploaded = videos.filter((v) => v.uploadedUrl).length;
    return `${uploaded}/${videos.length}`;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Upload Workout Videos
          </Text>
          <Text className="text-base text-gray-600 mb-2">
            Select videos of your exercises. We will automatically compress and
            analyze them to detect exercises and count reps. Videos must be
            under 20MB after compression.
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

        {/* Add Videos Button */}
        <TouchableOpacity
          onPress={pickVideos}
          disabled={isUploading}
          className={`border-2 border-dashed border-blue-400 rounded-lg p-6 mb-4 ${
            isUploading ? "opacity-50" : ""
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

        {/* Video List */}
        {videos.length > 0 && (
          <View className="mb-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Selected Videos ({videos.length})
            </Text>

            {videos.map((video, index) => (
              <View
                key={index}
                className="bg-white rounded-lg p-3 mb-3 border border-gray-200"
              >
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
                          {video.size > WARNING_SIZE_BYTES && (
                            <Ionicons
                              name="warning"
                              size={14}
                              color="#f59e0b"
                              style={{ marginRight: 4 }}
                            />
                          )}
                          <Text
                            className={`text-xs font-medium ${
                              video.size > WARNING_SIZE_BYTES
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
                        <Text className="text-sm text-blue-600 ml-2">
                          Uploading...
                        </Text>
                      </View>
                    )}

                    {video.uploadedUrl && (
                      <View className="flex-row items-center">
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#10b981"
                        />
                        <Text className="text-sm text-green-600 ml-2">
                          Uploaded
                        </Text>
                      </View>
                    )}

                    {video.error && (
                      <View className="flex-row items-center">
                        <Ionicons
                          name="alert-circle"
                          size={16}
                          color="#ef4444"
                        />
                        <Text className="text-sm text-red-600 ml-2">
                          {video.error}
                        </Text>
                      </View>
                    )}

                    {!video.uploading &&
                      !video.uploadedUrl &&
                      !video.error &&
                      !video.compressing && (
                        <Text className="text-sm text-gray-500">
                          Ready to upload
                        </Text>
                      )}
                  </View>

                  {/* Remove Button */}
                  {!video.uploading && (
                    <TouchableOpacity
                      onPress={() => removeVideo(index)}
                      className="p-2"
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <View className="bg-blue-50 rounded-lg p-4 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-semibold text-blue-900">
                Uploading Videos
              </Text>
              <Text className="text-sm text-blue-700">
                {getUploadProgress()}
              </Text>
            </View>
            <View className="bg-blue-200 h-2 rounded-full overflow-hidden">
              <View
                className="bg-blue-600 h-full"
                style={{
                  width: `${
                    (videos.filter((v) => v.uploadedUrl).length /
                      videos.length) *
                    100
                  }%`,
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
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
            onPress={uploadAllVideos}
            disabled={isUploading || videos.length === 0}
            className={`flex-1 rounded-lg py-4 px-6 ${
              isUploading || videos.length === 0 ? "bg-gray-300" : "bg-blue-600"
            }`}
          >
            <Text
              className={`text-center font-semibold text-base ${
                isUploading || videos.length === 0
                  ? "text-gray-500"
                  : "text-white"
              }`}
            >
              {isUploading ? "Uploading..." : "Upload & Analyze"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default VideoUploadMode;
