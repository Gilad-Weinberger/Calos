import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Plan } from "../../../lib/functions/planFunctions";
import ProgressBars from "../../ui/ProgressBars";

interface WeekOverviewCardProps {
  plan: Plan;
  weekIndex: number;
  weekWorkouts: {
    workoutLetter: string;
    workoutName: string;
    scheduledDate: Date;
    dayName: string;
    dayIndex: number;
    isCompleted: boolean;
    exerciseCount: number;
  }[];
}

const WeekOverviewCard: React.FC<WeekOverviewCardProps> = ({
  plan,
  weekIndex,
  weekWorkouts,
}) => {
  const router = useRouter();

  // Calculate week number display
  const weekDisplayText = useMemo(() => {
    if (plan.plan_type === "repeat") {
      // For recurring plans, show the cycle week number (1-indexed)
      const cycleWeekNumber = (weekIndex % plan.num_weeks) + 1;
      return `Week ${cycleWeekNumber} Overview`;
    } else {
      // For non-recurring plans, show current week number
      const displayWeek = Math.min(weekIndex + 1, plan.num_weeks);
      return `Week ${displayWeek} Overview`;
    }
  }, [plan.plan_type, plan.num_weeks, weekIndex]);

  // Calculate workout stats
  const totalWorkouts = weekWorkouts.length;
  const completedWorkouts = weekWorkouts.filter((w) => w.isCompleted).length;

  // Calculate exercise stats
  const totalExercises = weekWorkouts.reduce(
    (sum, workout) => sum + workout.exerciseCount,
    0
  );
  const completedExercises = weekWorkouts
    .filter((w) => w.isCompleted)
    .reduce((sum, workout) => sum + workout.exerciseCount, 0);

  // Navigate to plan overview page
  const handlePress = () => {
    router.push({
      pathname: "/(tabs)/plan/week-overview",
      params: { weekIndex: weekIndex.toString() },
    } as any);
  };

  // Don't render if there are no workouts
  if (totalWorkouts === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-2xl p-4 mb-4 mt-4"
      style={{
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {/* Header with title and arrow */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-gray-900 text-base font-semibold">
          {weekDisplayText}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </View>

      {/* Progress bars */}
      <View className="mb-3">
        <ProgressBars total={totalWorkouts} completed={completedWorkouts} />
      </View>

      {/* Stats */}
      <View className="flex-row justify-between">
        <Text className="text-gray-500 text-sm">
          Workouts: <Text className="text-gray-700">{completedWorkouts}/{totalWorkouts}</Text>
        </Text>
        <Text className="text-gray-500 text-sm">
          Exercises: <Text className="text-gray-700">{completedExercises}/{totalExercises}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default WeekOverviewCard;

