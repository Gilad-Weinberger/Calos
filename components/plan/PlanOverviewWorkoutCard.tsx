import React from "react";
import { Text, View } from "react-native";

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
    <View className="bg-white rounded-2xl mb-3 shadow-sm flex-row items-center">
      {/* Left: Vertical bar */}
      <View
        className="mr-3 absolute left-0 top-0 w-4 h-full bg-blue-600"
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
