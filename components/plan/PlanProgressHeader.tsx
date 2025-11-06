import React from "react";
import { Text, View } from "react-native";
import type { Plan } from "../../lib/functions/planFunctions";
import { getDaysElapsed } from "../../lib/utils/schedule";
import ProgressBars from "../ui/ProgressBars";

interface PlanProgressHeaderProps {
  plan: Plan;
  completedWorkouts: number;
  totalWorkouts: number;
  completedWeeks: number;
  endDate: Date | null;
}

const PlanProgressHeader: React.FC<PlanProgressHeaderProps> = ({
  plan,
  completedWorkouts,
  totalWorkouts,
  completedWeeks,
  endDate,
}) => {
  // Format date for display
  const formatDate = (date: Date): string => {
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Get start date from plan
  const startDate = plan.start_date ? new Date(plan.start_date) : null;

  // Calculate current week (1-indexed for display)
  const today = new Date();
  const daysElapsed = startDate ? getDaysElapsed(startDate, today) : 0;
  let currentWeek = 0;
  if (daysElapsed >= 0 && plan.plan_type === "once") {
    currentWeek = Math.min(Math.floor(daysElapsed / 7) + 1, plan.num_weeks);
  } else if (daysElapsed >= 0 && plan.plan_type === "repeat") {
    currentWeek = (Math.floor(daysElapsed / 7) % plan.num_weeks) + 1;
  }

  return (
    <View className="bg-white rounded-lg p-5 mb-4 relative shadow-sm">
      {/* Title */}
      <Text className="text-2xl font-bold text-gray-900 mb-2 pr-20">
        {plan.name}
      </Text>

      {/* Subtitle - Start Date and Race Date */}
      {endDate && startDate ? (
        <Text className="text-gray-600 text-sm mb-5">
          {startDate && `${formatDate(startDate)}`}
          {startDate && endDate && ` - `}
          {endDate && `${formatDate(endDate)}`}
        </Text>
      ) : (
        <Text className="text-gray-600 text-sm mb-5">
          {startDate && `Start Date: ${formatDate(startDate)}`}
        </Text>
      )}

      {/* Progress Bars - Current Week out of Total Weeks */}
      <View className="mb-6">
        <ProgressBars
          total={plan.num_weeks}
          completed={currentWeek}
        />
      </View>

      {/* Statistics */}
      <View className="flex-row justify-between">
        {/* Total Weeks */}
        <View className="flex-1">
          <Text className="text-gray-500 text-xs mb-1">Total Weeks</Text>

          {endDate ? (
            <Text className="text-gray-900 text-xl font-bold">
              {completedWeeks}/{plan.num_weeks}
            </Text>
          ) : (
            <Text className="text-gray-900 text-xl font-bold">
              Week {currentWeek}
            </Text>
          )}
        </View>

        {/* Total Workouts */}
        <View className="flex-1 items-end">
          <Text className="text-gray-500 text-xs mb-1">Total Workouts</Text>
          <Text className="text-gray-900 text-xl font-bold">
            {completedWorkouts}/{totalWorkouts}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PlanProgressHeader;

