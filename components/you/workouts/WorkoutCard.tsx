import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  calculateTotalReps,
  calculateTotalSets,
  deleteWorkout,
  formatWorkoutDate,
  getBestAchievement,
  WorkoutExercise,
} from "../../../lib/functions/workoutFunctions";
import AchievementIcon from "../../ui/AchievementIcon";
import VideoPlayerModal from "../../ui/VideoPlayerModal";

interface WorkoutCardProps {
  workout: {
    workout_id: string;
    workout_date: string;
    workout_exercises: {
      exercise_id: string;
      sets: number;
      reps: number[];
      order_index: number;
      video_urls?: string[];
      exercises: {
        name: string;
        type: "static" | "dynamic";
      };
    }[];
  };
  userName: string;
  userProfileImage: string | null;
  title?: string;
  achievements?: {
    icon: string;
    message: string;
  }[];
  onWorkoutDeleted?: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  userName,
  userProfileImage,
  title,
  achievements,
  onWorkoutDeleted,
}) => {
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    exerciseName: string;
    exerciseType: "static" | "dynamic";
    sets: number;
    reps: number[];
  } | null>(null);
  // Transform workout exercises to WorkoutExercise format
  const exercises: WorkoutExercise[] = workout.workout_exercises.map((we) => ({
    exercise_id: we.exercise_id,
    exercise_name: we.exercises.name,
    exercise_type: we.exercises.type,
    sets: we.sets,
    reps: we.reps,
    order_index: we.order_index,
  }));

  const totalSets = calculateTotalSets(exercises);
  const totalReps = calculateTotalReps(exercises);
  const totalExercises = exercises.length;
  const formattedDate = formatWorkoutDate(workout.workout_date);
  const bestAchievement = getBestAchievement(achievements || []);

  const handleCongratsPress = () => {
    router.push({
      pathname: "/workout-achievements/[id]",
      params: { id: workout.workout_id },
    });
  };

  const handleEditPress = () => {
    setMenuVisible(false);
    router.push({
      pathname: "/workout-edit/[id]",
      params: { id: workout.workout_id },
    });
  };

  const handleDeletePress = () => {
    setMenuVisible(false);
    Alert.alert(
      "Delete Workout",
      "Are you sure you want to delete this workout? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!user) return;
              await deleteWorkout(workout.workout_id, user.user_id);
              Alert.alert("Success", "Workout deleted successfully");
              if (onWorkoutDeleted) {
                onWorkoutDeleted();
              }
            } catch (error) {
              console.error("Error deleting workout:", error);
              Alert.alert(
                "Error",
                "Failed to delete workout. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // Check if workout has videos and collect them with exercise context
  const hasVideos = workout.workout_exercises.some(
    (ex) => ex.video_urls && ex.video_urls.length > 0
  );
  const videoCount = workout.workout_exercises.reduce(
    (count, ex) => count + (ex.video_urls?.length || 0),
    0
  );

  // Flatten all videos with their exercise context
  const videosWithContext = workout.workout_exercises.flatMap((ex) => {
    if (!ex.video_urls || ex.video_urls.length === 0) return [];
    return ex.video_urls.map((url) => ({
      url,
      exerciseName: ex.exercises.name,
      exerciseType: ex.exercises.type,
      sets: ex.sets,
      reps: ex.reps,
    }));
  });

  const handleVideoPress = (video: (typeof videosWithContext)[0]) => {
    setSelectedVideo(video);
    setVideoModalVisible(true);
  };

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      {/* Header Section */}
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center overflow-hidden mr-3">
          {userProfileImage ? (
            <Image
              source={{ uri: userProfileImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={24} color="white" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800">
            {userName}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="barbell" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">{formattedDate}</Text>
          </View>
        </View>

        {/* Menu Button */}
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          className="p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setMenuVisible(false)}
        >
          <View className="flex-1 justify-center items-center p-4">
            <View className="bg-white rounded-2xl w-64 overflow-hidden">
              <TouchableOpacity
                onPress={handleEditPress}
                className="flex-row items-center p-4 border-b border-gray-200"
              >
                <Ionicons name="create-outline" size={24} color="#3B82F6" />
                <Text className="text-base font-medium text-gray-900 ml-3">
                  Edit Workout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeletePress}
                className="flex-row items-center p-4"
              >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
                <Text className="text-base font-medium text-red-600 ml-3">
                  Delete Workout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Title Section */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-gray-800 flex-1">
          {title || `Workout Session`}
        </Text>
        {hasVideos && (
          <View className="bg-purple-100 rounded-full px-3 py-1 flex-row items-center">
            <Ionicons name="videocam" size={14} color="#9333EA" />
            <Text className="text-xs font-medium text-purple-700 ml-1">
              {videoCount}
            </Text>
          </View>
        )}
      </View>

      {/* Stats Section */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Total Sets</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {totalSets}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Total Reps</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {totalReps}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Exercises</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {totalExercises}
          </Text>
        </View>
        {achievements && achievements.length > 0 && (
          <View className="flex-1">
            <Text className="text-sm text-gray-500 mb-1">Achievements</Text>
            <View className="flex-row items-center">
              <Ionicons name="trophy" size={18} color="#F59E0B" />
              <Text className="text-lg font-semibold text-gray-800 ml-1">
                {achievements.length}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Congrats Section */}
      {bestAchievement && (
        <Pressable
          onPress={handleCongratsPress}
          className="bg-[#f2f2f0] rounded-lg p-4 mb-4 border border-orange-200"
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4 shadow-sm">
              <AchievementIcon
                type={bestAchievement.icon as "trophy" | "medal"}
                rank={bestAchievement.rank}
                size={24}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-orange-700 font-medium">
                {bestAchievement.message}
              </Text>
            </View>
          </View>
        </Pressable>
      )}

      {/* Video Carousel or Exercise Carousel Section */}
      {hasVideos ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {videosWithContext.map((video, index) => (
            <TouchableOpacity
              key={`${video.url}-${index}`}
              onPress={() => handleVideoPress(video)}
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
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {exercises.map((exercise, index) => (
            <View
              key={`${exercise.exercise_id}-${index}`}
              className="bg-gray-50 rounded-xl p-4 mr-2"
              style={{ width: 140, minHeight: 180 }}
            >
              {/* Exercise Type Icon */}
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mb-3">
                <Ionicons
                  name={
                    exercise.exercise_type === "dynamic" ? "flash" : "pause"
                  }
                  size={20}
                  color="#3B82F6"
                />
              </View>

              {/* Exercise Name */}
              <Text
                className="text-base font-semibold text-gray-800 mb-2"
                numberOfLines={2}
              >
                {exercise.exercise_name}
              </Text>

              {/* Exercise Type Badge */}
              <View className="bg-white rounded-full px-2 py-1 self-start mb-3">
                <Text className="text-xs text-gray-600 capitalize">
                  {exercise.exercise_type}
                </Text>
              </View>

              {/* Sets and Reps */}
              <View className="flex-1 justify-end">
                <Text className="text-xs text-gray-500 mb-1">
                  {exercise.sets} {exercise.sets === 1 ? "set" : "sets"}
                </Text>
                <Text className="text-sm font-medium text-gray-700">
                  {(() => {
                    const allSame = exercise.reps.every(
                      (rep) => rep === exercise.reps[0]
                    );
                    const unit =
                      exercise.exercise_type === "static" ? "seconds" : "reps";

                    if (allSame && exercise.reps.length > 1) {
                      return `${exercise.sets} × ${exercise.reps[0]} ${unit}`;
                    } else {
                      return `${exercise.reps.join(", ")} ${unit}`;
                    }
                  })()}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

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
          exerciseType={selectedVideo.exerciseType}
          sets={selectedVideo.sets}
          reps={selectedVideo.reps}
        />
      )}
    </View>
  );
};

export default WorkoutCard;
