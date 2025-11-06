import React from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface PlanOverviewWorkoutCardProps {
  workout: {
    workoutLetter: string;
    workoutName: string;
    scheduledDate: Date;
    dayName: string;
    dayIndex: number;
    isCompleted: boolean;
    exerciseCount: number;
  };
}

const PlanOverviewWorkoutCard: React.FC<PlanOverviewWorkoutCardProps> = ({
  workout,
}) => {
  // Format date
  const formatDate = (date: Date): string => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    return `${month} ${day}`;
  };

  return (
    <View
      className="bg-white rounded-2xl mb-3 flex-row items-center"
      style={{
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Left: Vertical bar */}
      <LinearGradient
        colors={["#1e40af", "#2563eb", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="mr-3 absolute left-0 top-0 w-4 h-full"
        style={{ borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }}
      />

      {/* Center: Workout details */}
      <View className="flex-1 p-4 ml-3">
        <Text className="text-gray-500 text-xs font-medium mb-1">
          {workout.dayName}, {formatDate(workout.scheduledDate)}
        </Text>
        <Text className="text-gray-900 text-lg font-bold mb-2">
          {workout.workoutName}
        </Text>
        <Text className="text-gray-500 text-sm">
          <Text className="font-semibold">Strength</Text> ·{" "}
          {workout.exerciseCount}{" "}
          {workout.exerciseCount === 1 ? "exercise" : "exercises"}
        </Text>
      </View>
    </View>
  );
};

export default PlanOverviewWorkoutCard;
