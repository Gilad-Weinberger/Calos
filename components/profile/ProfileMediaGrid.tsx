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

interface ProfileMediaGridProps {
  mediaItems: MediaItem[];
}

const ProfileMediaGrid: React.FC<ProfileMediaGridProps> = ({ mediaItems }) => {
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
  };

  const handleCloseVideo = () => {
    setVideoModalVisible(false);
    setSelectedVideo(null);
  };

  if (mediaItems.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <View className="flex-row flex-wrap">
        {mediaItems.slice(0, 6).map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleMediaPress(item)}
            className="w-[32%] aspect-square mb-1 mr-1"
            style={{ marginRight: index % 3 === 2 ? 0 : 4 }}
          >
            {item.type === "video" ? (
              <View className="w-full h-full bg-gray-200 rounded-lg overflow-hidden relative">
                <Video
                  source={{ uri: item.url }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  useNativeControls={false}
                />
                <View className="absolute inset-0 items-center justify-center bg-black/20">
                  <Ionicons name="play-circle" size={32} color="white" />
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: item.url }}
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <VideoPlayerModal
        visible={videoModalVisible}
        videoUrl={selectedVideo?.url || ""}
        exerciseName={selectedVideo?.exerciseName || "Exercise"}
        onClose={handleCloseVideo}
      />
    </View>
  );
};

export default ProfileMediaGrid;


