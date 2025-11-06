import React from "react";
import { Pressable, Text, View } from "react-native";
import AchievementIcon from "../../ui/AchievementIcon";

interface Achievement {
  icon: string;
  message: string;
  rank?: number;
}

interface WorkoutCardAchievementProps {
  achievement: Achievement;
  onPress: () => void;
}

const WorkoutCardAchievement: React.FC<WorkoutCardAchievementProps> = ({
  achievement,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-[#f2f2f0] rounded-lg p-4 mb-4 border border-orange-200"
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4 shadow-sm">
          <AchievementIcon
            type={achievement.icon as "trophy" | "medal"}
            rank={achievement.rank}
            size={24}
          />
        </View>
        <View className="flex-1">
          <Text className="text-sm text-orange-700 font-medium">
            {achievement.message}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default WorkoutCardAchievement;


