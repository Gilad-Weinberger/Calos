import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { router } from "expo-router";
import React, { memo, useMemo, useState } from "react";
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
  calculateWorkoutDuration,
  deleteWorkout,
  formatWorkoutDate,
  getBestAchievement,
  WorkoutExercise,
} from "../../../lib/functions/workoutFunctions";
import { groupExercisesBySuperset } from "../../../lib/utils/superset";
import { formatDuration } from "../../../lib/utils/timer";
import AchievementIcon from "../../ui/AchievementIcon";
import VideoPlayerModal from "../../ui/VideoPlayerModal";

interface WorkoutCardProps {
  workout: {
    workout_id: string;
    workout_date: string;
    start_time?: string;
    end_time?: string;
    plan_id?: string;
    plan_workout_letter?: string;
    title?: string;
    description?: string;
    workout_exercises: {
      exercise_id: string;
      sets: number;
      reps: number[];
      order_index: number;
      superset_group?: string;
      video_urls?: string[];
      exercises: {
        name: string;
        type: "static" | "dynamic";
      };
    }[];
  };
  userName: string;
  userProfileImage: string | null;
  userId?: string; // Add userId prop for navigation
  title?: string;
  planName?: string;
  achievements?: {
    icon: string;
    message: string;
  }[];
  onWorkoutDeleted?: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = memo(
  ({
    workout,
    userName,
    userProfileImage,
    userId,
    achievements,
    onWorkoutDeleted,
  }) => {
    const { user } = useAuth();
    const [menuVisible, setMenuVisible] = useState(false);
    const [videoModalVisible, setVideoModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<{
      url: string;
      exerciseName: string;
      exerciseType: "static" | "dynamic";
      sets: number;
      reps: number[];
    } | null>(null);
    // Memoize expensive calculations
    const exercises: WorkoutExercise[] = useMemo(
      () =>
        workout.workout_exercises.map((we) => ({
          exercise_id: we.exercise_id,
          exercise_name: we.exercises.name,
          exercise_type: we.exercises.type,
          sets: we.sets,
          reps: we.reps,
          order_index: we.order_index,
          superset_group: we.superset_group,
        })),
      [workout.workout_exercises]
    );

    const {
      totalSets,
      totalExercises,
      formattedDate,
      bestAchievement,
      durationText,
    } = useMemo(() => {
      const totalSets = calculateTotalSets(exercises);
      const totalReps = calculateTotalReps(exercises);
      const totalExercises = exercises.length;
      const formattedDate = formatWorkoutDate(workout.workout_date);
      const bestAchievement = getBestAchievement(achievements || []);

      // Calculate workout duration if available
      const durationSeconds = calculateWorkoutDuration(
        workout.start_time || null,
        workout.end_time || null
      );
      const durationText = durationSeconds
        ? formatDuration(durationSeconds)
        : null;

      return {
        totalSets,
        totalReps,
        totalExercises,
        formattedDate,
        bestAchievement,
        durationText,
      };
    }, [
      exercises,
      workout.workout_date,
      workout.start_time,
      workout.end_time,
      achievements,
    ]);

    const handleCongratsPress = () => {
      router.push({
        pathname: "/workout/achievements/[id]",
        params: { id: workout.workout_id },
      });
    };

    const handleEditPress = () => {
      setMenuVisible(false);
      router.push({
        pathname: "/workout/edit/[id]",
        params: { id: workout.workout_id },
      });
    };

    const handleDeletePress = () => {
      setMenuVisible(false);

      // Check if user is available before showing confirmation
      if (!user?.user_id) {
        Alert.alert(
          "Error",
          "You must be logged in to delete a workout. Please sign in and try again."
        );
        return;
      }

      // Prevent multiple deletions at once
      if (isDeleting) {
        return;
      }

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
              setIsDeleting(true);
              try {
                await deleteWorkout(workout.workout_id, user.user_id);
                Alert.alert("Success", "Workout deleted successfully");
                if (onWorkoutDeleted) {
                  onWorkoutDeleted();
                }
              } catch (error) {
                console.error("Error deleting workout:", error);
                const errorMessage =
                  error instanceof Error
                    ? error.message
                    : "Failed to delete workout. Please try again.";
                Alert.alert("Error", errorMessage);
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ]
      );
    };

    // Memoize video-related calculations
    const { hasVideos, videosWithContext } = useMemo(() => {
      const hasVideos = workout.workout_exercises.some(
        (ex) => ex.video_urls && ex.video_urls.length > 0
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

      return { hasVideos, videosWithContext };
    }, [workout.workout_exercises]);

    const handleVideoPress = (video: (typeof videosWithContext)[0]) => {
      setSelectedVideo(video);
      setVideoModalVisible(true);
    };

    const handleUserPress = () => {
      if (userId) {
        router.push({
          pathname: "/profile/[id]",
          params: { id: userId },
        });
      }
    };

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
        {/* Header Section */}
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            onPress={handleUserPress}
            disabled={!userId}
            className="flex-row items-center flex-1"
            activeOpacity={userId ? 0.7 : 1}
          >
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
                <Text className="text-sm text-gray-600 ml-1">
                  {formattedDate}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

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
                  disabled={isDeleting}
                  style={{ opacity: isDeleting ? 0.5 : 1 }}
                >
                  <Ionicons name="trash-outline" size={24} color="#EF4444" />
                  <Text className="text-base font-medium text-red-600 ml-3">
                    {isDeleting ? "Deleting..." : "Delete Workout"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Title Section */}
        <Text className="text-xl font-bold text-gray-800 flex-1 mt-1">
          {workout.title || `Workout Session`}
        </Text>

        {/* Description Section */}
        {workout.description && (
          <Text className="text-sm text-gray-600 leading-5">
            {workout.description}
          </Text>
        )}

        {/* Stats Section */}
        <View className="flex-row justify-between mb-4 mt-4">
          {/* <View className="flex-1">
            <Text className="text-sm text-gray-500 mb-1">Total Reps</Text>
            <Text className="text-lg font-semibold text-gray-800">
              {totalReps}
            </Text>
          </View> */}
          <View className="flex-1">
            <Text className="text-sm text-gray-500 mb-1">Exercises</Text>
            <Text className="text-lg font-semibold text-gray-800">
              {totalExercises}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-gray-500 mb-1">Total Sets</Text>
            <Text className="text-lg font-semibold text-gray-800">
              {totalSets}
            </Text>
          </View>
          {durationText && (
            <View className="flex-1">
              <Text className="text-sm text-gray-500 mb-1">Duration</Text>
              <Text className="text-lg font-semibold text-gray-800">
                {durationText}
              </Text>
            </View>
          )}
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
            {groupExercisesBySuperset(exercises).map((group, groupIndex) => {
              if (group.isSuperset) {
                return (
                  <View
                    key={`superset-${groupIndex}`}
                    className="bg-blue-50 rounded-xl p-4 mr-2 border-2 border-blue-200"
                    style={{ width: 160, minHeight: 180 }}
                  >
                    {/* Superset Badge */}
                    <View className="bg-blue-600 rounded-full px-2 py-1 self-start mb-2">
                      <Text className="text-xs font-bold text-white">
                        SUPERSET
                      </Text>
                    </View>

                    {/* Exercises in Superset */}
                    {group.exercises.map((exercise, exIndex) => {
                      // Cast to WorkoutExercise since we're in workout history
                      const workoutEx = exercise as WorkoutExercise;
                      return (
                        <View key={exIndex} className="mb-2">
                          <Text
                            className="text-sm font-semibold text-gray-800"
                            numberOfLines={1}
                          >
                            {workoutEx.exercise_name}
                          </Text>
                          <Text className="text-xs text-gray-600">
                            {workoutEx.sets}×
                            {(() => {
                              const allSame = workoutEx.reps.every(
                                (rep: number) => rep === workoutEx.reps[0]
                              );
                              const unit =
                                workoutEx.exercise_type === "static" ? "s" : "";
                              if (allSame) {
                                return `${workoutEx.reps[0]}${unit}`;
                              }
                              return workoutEx.reps.join("-") + unit;
                            })()}
                          </Text>
                        </View>
                      );
                    })}
                    <Text className="text-xs text-blue-600 mt-1 italic">
                      No rest between
                    </Text>
                  </View>
                );
              } else {
                // Cast to WorkoutExercise since we're in workout history
                const workoutEx: WorkoutExercise = group
                  .exercises[0] as WorkoutExercise;
                return (
                  <View
                    key={`${workoutEx.exercise_id}-${groupIndex}`}
                    className="bg-gray-50 rounded-xl p-4 mr-2"
                    style={{ width: 140, minHeight: 180 }}
                  >
                    {/* Exercise Type Icon */}
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${workoutEx.exercise_type === "dynamic" ? "bg-blue-100" : "bg-green-100"}`}
                    >
                      <Ionicons
                        name={
                          workoutEx.exercise_type === "dynamic"
                            ? "flash"
                            : "time"
                        }
                        size={20}
                        color={
                          workoutEx.exercise_type === "dynamic"
                            ? "#3B82F6"
                            : "#22C55E"
                        }
                      />
                    </View>

                    {/* Exercise Name */}
                    <Text
                      className="text-base font-semibold text-gray-800 mb-2"
                      numberOfLines={2}
                    >
                      {workoutEx.exercise_name}
                    </Text>

                    {/* Sets and Reps */}
                    <View className="flex-1 justify-end">
                      <Text className="text-xs text-gray-500 mb-1">
                        {workoutEx.sets} {workoutEx.sets === 1 ? "set" : "sets"}
                      </Text>
                      <Text className="text-sm font-medium text-gray-700">
                        {(() => {
                          const allSame = workoutEx.reps.every(
                            (rep: number) => rep === workoutEx.reps[0]
                          );
                          const unit =
                            workoutEx.exercise_type === "static"
                              ? "seconds"
                              : "reps";

                          if (allSame && workoutEx.reps.length > 1) {
                            return `${workoutEx.sets} × ${workoutEx.reps[0]} ${unit}`;
                          } else {
                            return `${workoutEx.reps.join(", ")} ${unit}`;
                          }
                        })()}
                      </Text>
                    </View>
                  </View>
                );
              }
            })}
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
  }
);

WorkoutCard.displayName = "WorkoutCard";

export default WorkoutCard;
