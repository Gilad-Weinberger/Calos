import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface PlanWorkoutStatsProps {
  totalExercises: number;
  scheduledLabel: string;
}

const StatPill: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
    <View className="w-8 h-8 rounded-full bg-black/90 items-center justify-center mr-3">
      <Ionicons name={icon} size={18} color="white" />
    </View>
    <View>
      <Text className="text-xs uppercase text-gray-400 tracking-widest">
        {label}
      </Text>
      <Text className="text-base font-semibold text-gray-900">{value}</Text>
    </View>
  </View>
);

const PlanWorkoutStats: React.FC<PlanWorkoutStatsProps> = ({
  totalExercises,
  scheduledLabel,
}) => {
  return (
    <View className="flex-row flex-wrap gap-3">
      <StatPill icon="calendar" label="Scheduled" value={scheduledLabel} />
      <StatPill icon="barbell" label="Exercises" value={`${totalExercises}`} />
    </View>
  );
};

export default PlanWorkoutStats;

