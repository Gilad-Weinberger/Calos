import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ProfileWorkoutSectionProps {
  userId: string;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
  getFriendlyDate: (date: Date) => string;
}

const ProfileWorkoutSection: React.FC<ProfileWorkoutSectionProps> = ({
  userId,
  totalWorkouts,
  lastWorkoutDate,
  getFriendlyDate,
}) => {
  const handleViewWorkouts = () => {
    router.push({
      pathname: "/profile/workouts/[id]",
      params: { id: userId },
    });
  };

  return (
    <View className="mb-6">
      <TouchableOpacity
        onPress={handleViewWorkouts}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-4">
          <Ionicons name="barbell-outline" size={26} color="#6B7280" />
          <View>
            <Text className="text-lg font-semibold text-gray-800">Workouts</Text>
            {totalWorkouts > 0 && lastWorkoutDate && (
              <Text className="text-sm text-gray-500">
                {getFriendlyDate(new Date(lastWorkoutDate))}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileWorkoutSection;

