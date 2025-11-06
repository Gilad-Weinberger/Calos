import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Video as VideoCompressor } from "react-native-compressor";
import { uploadWorkoutVideo } from "../../../lib/functions/videoFunctions";
import VideoUploadActions from "./VideoUploadActions";
import VideoUploadButton from "./VideoUploadButton";
import VideoUploadHeader from "./VideoUploadHeader";
import VideoUploadList from "./VideoUploadList";
import VideoUploadProgress from "./VideoUploadProgress";

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

interface WorkoutVideoUploadModeProps {
  userId: string;
  onVideosUploaded: (videoUrls: string[]) => void;
  onCancel: () => void;
}

const WorkoutVideoUploadMode: React.FC<WorkoutVideoUploadModeProps> = ({
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

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        <VideoUploadHeader />

        <VideoUploadButton onPress={pickVideos} disabled={isUploading} />

        <VideoUploadList
          videos={videos}
          onRemove={removeVideo}
          formatFileSize={formatFileSize}
          warningSizeBytes={WARNING_SIZE_BYTES}
        />

        <VideoUploadProgress videos={videos} isUploading={isUploading} />
      </ScrollView>

      <VideoUploadActions
        onCancel={onCancel}
        onUpload={uploadAllVideos}
        isUploading={isUploading}
        hasVideos={videos.length > 0}
      />
    </View>
  );
};

export default WorkoutVideoUploadMode;

