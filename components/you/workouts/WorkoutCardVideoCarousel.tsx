import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface VideoWithContext {
  url: string;
  exerciseName: string;
  exerciseType: "static" | "dynamic";
  sets: number;
  reps: number[];
}

interface WorkoutCardVideoCarouselProps {
  videos: VideoWithContext[];
  onVideoPress: (video: VideoWithContext) => void;
}

const WorkoutCardVideoCarousel: React.FC<WorkoutCardVideoCarouselProps> = ({
  videos,
  onVideoPress,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-row"
      contentContainerStyle={{ paddingRight: 16 }}
    >
      {videos.map((video, index) => (
        <TouchableOpacity
          key={`${video.url}-${index}`}
          onPress={() => onVideoPress(video)}
          activeOpacity={0.8}
          className="mr-3 rounded-xl overflow-hidden"
          style={{ width: 160, height: 240 }}
        >
          <View className="w-full h-full">
            <Video
              source={{ uri: video.url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isLooping={false}
              isMuted
            />
            {/* Dark overlay with exercise name */}
            <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-3">
              <Text
                className="text-white text-sm font-semibold"
                numberOfLines={2}
              >
                {video.exerciseName}
              </Text>
            </View>
            {/* Play icon overlay */}
            <View className="absolute inset-0 items-center justify-center">
              <View className="bg-black/40 rounded-full p-3">
                <Ionicons name="play" size={32} color="white" />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default WorkoutCardVideoCarousel;


