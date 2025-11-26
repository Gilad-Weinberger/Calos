import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import React from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { WorkoutExercise } from "../../../lib/functions/workoutFunctions";
import { groupExercisesBySuperset } from "../../../lib/utils/superset";
import WorkoutCardExerciseItem from "./WorkoutCardExerciseItem";
import WorkoutCardSupersetItem from "./WorkoutCardSupersetItem";

type MediaItem =
  | {
      type: "video";
      url: string;
      exerciseName: string;
      exerciseType: "static" | "dynamic";
      sets: number;
      reps: number[];
    }
  | { type: "image"; url: string };

interface WorkoutCardMediaCarouselProps {
  mediaItems: MediaItem[];
  exercises: WorkoutExercise[];
  onMediaPress: (media: MediaItem) => void;
}

const WorkoutCardMediaCarousel: React.FC<WorkoutCardMediaCarouselProps> = ({
  mediaItems,
  exercises,
  onMediaPress,
}) => {
  const groupedExercises = groupExercisesBySuperset(exercises);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-row"
      contentContainerStyle={{ paddingRight: 16 }}
    >
      {/* Render videos */}
      {mediaItems
        .filter((item) => item.type === "video")
        .map((video, index) => (
          <TouchableOpacity
            key={`video-${index}`}
            onPress={() => onMediaPress(video)}
            activeOpacity={0.8}
            className="mr-3 rounded-xl overflow-hidden"
            style={{ width: 160, height: 160 }}
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
              {/* Play icon overlay */}
              <View className="absolute inset-0 items-center justify-center">
                <View className="bg-black/40 rounded-full p-3">
                  <Ionicons name="play" size={32} color="white" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

      {/* Render images - clickable but no play icon */}
      {mediaItems
        .filter((item) => item.type === "image")
        .map((image, index) => (
          <TouchableOpacity
            key={`image-${index}`}
            onPress={() => onMediaPress(image)}
            activeOpacity={0.8}
            className="mr-3 rounded-xl overflow-hidden"
            style={{ width: 160, height: 160 }}
          >
            <Image
              source={{ uri: image.url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}

      {/* Render exercises */}
      {groupedExercises.map((group, groupIndex) => {
        if (group.isSuperset) {
          return (
            <WorkoutCardSupersetItem
              key={`superset-${groupIndex}`}
              exercises={group.exercises as WorkoutExercise[]}
              supersetGroup={group.exercises[0].superset_group || ""}
            />
          );
        } else {
          const workoutEx: WorkoutExercise = group
            .exercises[0] as WorkoutExercise;
          return (
            <WorkoutCardExerciseItem
              key={`${workoutEx.exercise_id}-${groupIndex}`}
              exercise={workoutEx}
            />
          );
        }
      })}
    </ScrollView>
  );
};

export default WorkoutCardMediaCarousel;
