import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React, { useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import VideoPlayerModal from "../ui/VideoPlayerModal";

interface MediaItem {
  url: string;
  type: "video" | "image";
  exerciseName?: string;
  workoutDate: string;
}

interface MediaGridProps {
  mediaItems: MediaItem[];
}

const MediaGrid: React.FC<MediaGridProps> = ({ mediaItems }) => {
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    exerciseName: string;
  } | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);

  const handleMediaPress = (item: MediaItem) => {
    if (item.type === "video") {
      setSelectedVideo({
        url: item.url,
        exerciseName: item.exerciseName || "Exercise",
      });
      setVideoModalVisible(true);
    }
    // For images, we could show a full-screen image modal here
  };

  const renderMediaItem = (item: MediaItem, index: number) => {
    if (item.type === "video") {
      return (
        <TouchableOpacity
          key={`${item.url}-${index}`}
          onPress={() => handleMediaPress(item)}
          activeOpacity={0.8}
          className="flex-1 aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          <Video
            source={{ uri: item.url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isLooping={false}
            isMuted
          />
          {/* Play icon overlay */}
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/40 rounded-full p-2">
              <Ionicons name="play" size={20} color="white" />
            </View>
          </View>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          key={`${item.url}-${index}`}
          onPress={() => handleMediaPress(item)}
          activeOpacity={0.8}
          className="flex-1 aspect-square rounded-lg overflow-hidden bg-gray-100"
        >
          <Image
            source={{ uri: item.url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }
  };

  // Only show actual media items, no placeholders
  const displayItems = mediaItems.slice(0, 4);

  return (
    <View className="mb-6">
      <View className="flex-row gap-2">
        {displayItems.map((item, index) => (
          <View
            key={`media-${index}`}
            className="flex-1"
            style={{ maxWidth: "23%" }}
          >
            {renderMediaItem(item, index)}
          </View>
        ))}
      </View>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          visible={videoModalVisible}
          onClose={() => {
            setVideoModalVisible(false);
            setSelectedVideo(null);
          }}
          videoUrl={selectedVideo.url}
          exerciseName={selectedVideo.exerciseName}
          exerciseType="dynamic" // Default to dynamic for media grid
          sets={1}
          reps={[1]}
        />
      )}
    </View>
  );
};

export default MediaGrid;
