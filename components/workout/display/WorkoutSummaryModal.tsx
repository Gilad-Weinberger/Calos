import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import {
  Achievement,
  calculateTotalReps,
  calculateTotalSets,
  calculateWorkoutDuration,
  formatWorkoutDate,
} from "../../../lib/functions/workoutFunctions";
import { formatDuration } from "../../../lib/utils/timer";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;

interface WorkoutSummaryModalProps {
  visible: boolean;
  workout: any; // DatabaseWorkout structure
  achievements?: Achievement[];
  onClose: () => void;
  userName: string;
}

type HeroMetricType = "volume" | "duration" | "sets" | "pr" | "achievement";

interface HeroMetric {
  type: HeroMetricType;
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: readonly [string, string];
  achievement?: Achievement;
}

interface GroupedMetric {
  title: string;
  metrics: HeroMetric[];
  exerciseName?: string;
}

const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  visible,
  workout,
  achievements = [],
  onClose,
  userName,
}) => {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Reset variant index when group changes
  const handleGroupSelect = (index: number) => {
    setSelectedGroupIndex(index);
    setSelectedVariantIndex(0);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const exercises = workout.workout_exercises || [];
    const totalSets = calculateTotalSets(exercises as any);
    const totalReps = calculateTotalReps(exercises as any);
    const durationSeconds = calculateWorkoutDuration(
      workout.start_time || null,
      workout.end_time || null
    );

    return {
      totalSets,
      totalReps,
      duration: durationSeconds ? formatDuration(durationSeconds) : "N/A",
    };
  }, [workout]);

  // Generate Grouped Metrics
  const groupedMetrics: GroupedMetric[] = useMemo(() => {
    const groups: GroupedMetric[] = [];

    // 1. Group Achievements by Exercise
    if (achievements && achievements.length > 0) {
      const achievementGroups = new Map<string, HeroMetric[]>();

      achievements.forEach((achievement) => {
        const exerciseName = achievement.exerciseName || "General";
        let subtitle = achievement.message;

        if (achievement.value && achievement.exerciseName) {
          const unit = achievement.unit || "reps";
          const isTotal = achievement.message.toLowerCase().includes("total");

          if (isTotal) {
            subtitle = `Total of ${achievement.value} ${unit} in ${achievement.exerciseName}`;
          } else {
            subtitle = `${achievement.value} ${unit} in ${achievement.exerciseName}`;
          }
        }

        const metric: HeroMetric = {
          type: achievement.rank === 1 ? "pr" : "achievement",
          title:
            achievement.rank === 1
              ? "New Personal Record!"
              : "Achievement Unlocked",
          value: achievement.rank === 1 ? "NEW PR" : "MEDAL EARNED",
          subtitle: subtitle,
          icon: "trophy",
          color: ["#2563EB", "#1E40AF"],
          achievement,
        };

        if (!achievementGroups.has(exerciseName)) {
          achievementGroups.set(exerciseName, []);
        }
        achievementGroups.get(exerciseName)?.push(metric);
      });

      achievementGroups.forEach((metrics, exerciseName) => {
        groups.push({
          title: exerciseName === "General" ? "Achievements" : exerciseName,
          exerciseName: exerciseName === "General" ? undefined : exerciseName,
          metrics: metrics,
        });
      });
    }

    // 2. Total Volume / Sets (Standard Group)
    groups.push({
      title: "Total Volume",
      metrics: [
        {
          type: "sets",
          title: "Total Volume",
          value: `${stats.totalSets} Sets`,
          subtitle: `${stats.totalReps} Total Reps Completed`,
          icon: "barbell",
          color: ["#3B82F6", "#2563EB"],
        },
      ],
    });

    // 3. Duration (Standard Group)
    if (stats.duration !== "N/A") {
      groups.push({
        title: "Time Crunched",
        metrics: [
          {
            type: "duration",
            title: "Time Crunched",
            value: stats.duration,
            subtitle: "Focus Mode Activated",
            icon: "time",
            color: ["#60A5FA", "#3B82F6"],
          },
        ],
      });
    }

    return groups;
  }, [achievements, stats]);

  const activeGroup = groupedMetrics[selectedGroupIndex] || groupedMetrics[0];
  const activeMetric =
    activeGroup.metrics[selectedVariantIndex] || activeGroup.metrics[0];

  const handleShare = async () => {
    if (viewShotRef.current?.capture) {
      setIsSharing(true);
      try {
        const uri = await viewShotRef.current.capture();
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert("Error", "Sharing is not available on this device");
          return;
        }
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share your workout",
          UTI: "public.png",
        });
      } catch (error) {
        console.error("Sharing failed", error);
        Alert.alert("Error", "Failed to share workout image");
      } finally {
        setIsSharing(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-gray-900" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 pt-2">
          <Text className="text-white text-lg font-bold">Share Workout</Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Primary Selection Carousel (Groups) */}
          <View className="py-4">
            <Text className="text-gray-400 text-sm font-medium px-4 mb-3">
              CHOOSE YOUR HIGHLIGHT
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {groupedMetrics.map((group, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleGroupSelect(index)}
                  className={`mr-3 px-4 py-2 rounded-full border flex-row items-center ${
                    selectedGroupIndex === index
                      ? "bg-white border-white"
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      selectedGroupIndex === index
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {group.exerciseName
                      ? (group.metrics[0]?.type === "pr" ? "🏆 " : "🏅 ") +
                        group.exerciseName
                      : group.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Secondary Selection Slider (Variants within Group) - Only show if multiple variants */}
          {activeGroup.metrics.length > 1 && (
            <View className="pb-2 -mt-2">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {activeGroup.metrics.map((metric, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedVariantIndex(index)}
                    className={`mr-2 px-3 py-1.5 rounded-lg border ${
                      selectedVariantIndex === index
                        ? "bg-blue-600 border-blue-500"
                        : "bg-gray-800 border-gray-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedVariantIndex === index
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    >
                      {metric.achievement?.message?.includes("total reps")
                        ? "Total Reps"
                        : metric.achievement?.message?.includes("PR")
                          ? "Best Set"
                          : `Achievement ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* The Shareable Card Wrapper (Center Alignment) */}
          <View className="items-center justify-center py-4">
            <ViewShot
              ref={viewShotRef}
              options={{ format: "png", quality: 1.0 }}
              style={{ backgroundColor: "transparent" }}
            >
              <View
                style={{
                  width: CARD_WIDTH,
                  height: CARD_WIDTH * 1.4, // Story Aspect Ratio-ish
                  borderRadius: 24,
                  overflow: "hidden",
                  backgroundColor: "#111827", // Fallback
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                {/* Dynamic Gradient Background */}
                <LinearGradient
                  colors={activeMetric.color}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                  }}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />

                {/* Overlay Texture/Pattern */}
                <View className="absolute inset-0 bg-black/10" />

                {/* Content Container */}
                <View className="flex-1 p-6 justify-between">
                  {/* Top Section: Header */}
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="text-white/80 font-semibold text-sm uppercase tracking-wider">
                        {formatWorkoutDate(workout.workout_date)}
                      </Text>
                      <Text className="text-white font-bold text-xl mt-1">
                        {workout.title || "Workout Session"}
                      </Text>
                    </View>
                    <Image
                      source={require("../../../assets/images/logo.png")}
                      style={{ width: 40, height: 40, borderRadius: 100 }}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Middle Section: Hero Metric */}
                  <View className="items-center justify-center py-8">
                    <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-6 backdrop-blur-md border border-white/30">
                      <Ionicons
                        name={activeMetric.icon}
                        size={48}
                        color="white"
                      />
                    </View>
                    <Text
                      className="text-white font-black text-4xl text-center leading-tight shadow-sm"
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      {activeMetric.value}
                    </Text>
                    <Text
                      className="text-white/90 text-base font-medium text-center mt-2 max-w-[90%]"
                      adjustsFontSizeToFit
                      numberOfLines={2}
                    >
                      {activeMetric.subtitle || activeMetric.title}
                    </Text>
                  </View>

                  {/* Bottom Section: Secondary Stats Grid */}
                  <View className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                    <View className="flex-row justify-between">
                      <View className="items-center flex-1 border-r border-white/10">
                        <Text className="text-white/60 text-xs uppercase font-bold mb-1">
                          Sets
                        </Text>
                        <Text className="text-white text-lg font-bold">
                          {stats.totalSets}
                        </Text>
                      </View>
                      <View className="items-center flex-1 border-r border-white/10">
                        <Text className="text-white/60 text-xs uppercase font-bold mb-1">
                          Exercises
                        </Text>
                        <Text className="text-white text-lg font-bold">
                          {workout.workout_exercises?.length || 0}
                        </Text>
                      </View>
                      <View className="items-center flex-1">
                        <Text className="text-white/60 text-xs uppercase font-bold mb-1">
                          Duration
                        </Text>
                        <Text className="text-white text-lg font-bold">
                          {stats.duration}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Footer: Branding */}
                  <View className="flex-row items-center mt-6">
                    <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-3">
                      <Ionicons name="person" size={16} color="white" />
                    </View>
                    <View>
                      <Text className="text-white font-bold text-sm">
                        {userName}
                      </Text>
                      <Text className="text-white/60 text-xs">
                        Tracked with Calos
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ViewShot>
          </View>

          {/* Instructions */}
          <Text className="text-center text-gray-500 text-xs mt-2 mb-8">
            Tap &apos;Share&apos; to post this to your Story
          </Text>
        </ScrollView>

        {/* Bottom Action Button */}
        <View className="p-4 bg-gray-900 border-t border-gray-800">
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            className="bg-blue-600 h-14 rounded-xl flex-row items-center justify-center active:bg-blue-700"
          >
            {isSharing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons
                  name="share-social"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-lg">Share</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default WorkoutSummaryModal;
