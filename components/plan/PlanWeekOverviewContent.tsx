import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { type Plan as PlanType } from "../../lib/functions/planFunctions";
import ProgressBars from "../ui/ProgressBars";
import PlanOverviewWorkoutCard from "./PlanOverviewWorkoutCard";

interface WeekWorkout {
  workoutLetter: string;
  workoutName: string;
  scheduledDate: Date;
  dayName: string;
  dayIndex: number;
  isCompleted: boolean;
  exerciseCount: number;
  workoutId?: string | null;
}

interface PlanWeekOverviewContentProps {
  weekIndex: number;
  weekWorkouts: WeekWorkout[];
  activePlan: PlanType;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const PlanWeekOverviewContent: React.FC<PlanWeekOverviewContentProps> = ({
  weekIndex,
  weekWorkouts,
  activePlan,
  onPrevWeek,
  onNextWeek,
}) => {
  // Calculate total exercises
  const totalExercises = weekWorkouts.reduce(
    (sum, workout) => sum + workout.exerciseCount,
    0
  );

  // Calculate completed days for progress bars (7 bars for the week)
  const completedDays = weekWorkouts.filter((w) => w.isCompleted).length;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        {/* Week Selector */}
        <View className="flex-row items-center justify-between mb-4 px-0">
          <TouchableOpacity
            onPress={onPrevWeek}
            disabled={weekIndex === 0}
            className={`p-2 ${weekIndex === 0 ? "opacity-30" : ""}`}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={weekIndex === 0 ? "#999" : "#000"}
            />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">
            Week {weekIndex + 1}
          </Text>
          <TouchableOpacity
            onPress={onNextWeek}
            disabled={weekIndex >= activePlan.num_weeks - 1}
            className={`p-2 ${
              weekIndex >= activePlan.num_weeks - 1 ? "opacity-30" : ""
            }`}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={weekIndex >= activePlan.num_weeks - 1 ? "#999" : "#000"}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Bars - 7 bars for the week */}
        <View className="mb-4">
          <ProgressBars total={7} completed={completedDays} />
        </View>

        {/* Summary Stats */}
        <View className="mb-6">
          <Text className="text-gray-600 text-sm mb-1">
            Total Workouts:{" "}
            <Text className="font-semibold text-gray-900">
              {weekWorkouts.length}
            </Text>
          </Text>
          <Text className="text-gray-600 text-sm">
            Total Exercises:{" "}
            <Text className="font-semibold text-gray-900">
              {totalExercises}
            </Text>
          </Text>
        </View>

        {/* Workout List */}
        <View>
          {weekWorkouts.map((workout, index) => (
            <PlanOverviewWorkoutCard
              key={`${workout.workoutLetter}-${workout.dayIndex}`}
              workout={workout}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default PlanWeekOverviewContent;
