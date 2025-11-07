import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { PlanWorkoutViewModel } from "./types";

interface PlanWorkoutHeaderProps {
  viewModel: PlanWorkoutViewModel;
  onBack: () => void;
  onShare: () => void;
  scheduledLabel: string;
  weekLabel: string;
}

const PlanWorkoutHeader: React.FC<PlanWorkoutHeaderProps> = ({
  viewModel,
  onBack,
  onShare,
  scheduledLabel,
  weekLabel,
}) => {
  return (
    <LinearGradient
      colors={["#bef264", "#86efac"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="px-6 pt-14 pb-16"
    >
      <View className="flex-row items-center justify-between mb-10">
        <TouchableOpacity
          onPress={onBack}
          className="w-10 h-10 rounded-full bg-white/60 items-center justify-center"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>

        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={onShare}
            className="w-10 h-10 rounded-full bg-white/60 items-center justify-center"
            accessibilityLabel="Share workout"
          >
            <Ionicons name="share-social" size={20} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="space-y-2">
        <Text className="text-xs uppercase text-black/70 font-semibold tracking-widest">
          {weekLabel}
        </Text>
        <Text className="text-3xl font-bold text-gray-900">
          {viewModel.title}
        </Text>
        <Text className="text-base text-gray-800/80">
          {viewModel.planName || 'Plan Workout'} • {scheduledLabel}
        </Text>
        {!viewModel.isCompleted ? (
          <View className="self-start mt-4 rounded-full bg-black/80 px-3 py-1">
            <Text className="text-white text-xs font-semibold uppercase">
              Upcoming
            </Text>
          </View>
        ) : (
          <View className="self-start mt-4 rounded-full bg-white/80 px-3 py-1">
            <Text className="text-black text-xs font-semibold uppercase">
              Completed
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

export default PlanWorkoutHeader;

