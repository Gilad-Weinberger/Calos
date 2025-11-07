import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    <SafeAreaView edges={["top"]}>
      <LinearGradient
        colors={["#3b82f6", "#60a5fa", "#93c5fd", "#F3F4F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className=""
      >
        <View className="px-4" style={{ paddingTop: 12, paddingBottom: 6 }}>
          <View className="flex-row items-center">
            {/* Back button */}
            <TouchableOpacity
              onPress={onBack}
              className="mr-4 p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>

            {/* Title */}
            <Text className="text-xl font-bold text-gray-800 flex-1">
              {weekLabel}
            </Text>

            {/* Right side icons */}
            <TouchableOpacity
              onPress={onShare}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Share workout"
            >
              <Ionicons name="share-social" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="space-y-2 px-6 pb-16 pt-6">
          <Text className="text-xs uppercase text-black/70 font-semibold tracking-widest">
            {weekLabel}
          </Text>
          <Text className="text-3xl font-bold text-gray-900">
            {viewModel.title}
          </Text>
          <Text className="text-base text-gray-800/80">
            {viewModel.planName || "Plan Workout"} • {scheduledLabel}
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
    </SafeAreaView>
  );
};

export default PlanWorkoutHeader;
