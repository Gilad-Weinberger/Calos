import React from "react";
import { Text, View } from "react-native";
import { Plan } from "../../lib/functions/planFunctions";

interface WeekScheduleProps {
  plan: Plan;
  weekNumber: number | null;
  dayInWeek: number;
}

const WeekSchedule: React.FC<WeekScheduleProps> = ({
  plan,
  weekNumber,
  dayInWeek,
}) => {
  if (weekNumber === null) {
    return null;
  }

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-600 mb-2 text-center">
        Week {weekNumber + 1}
      </Text>
      <View className="flex-row flex-wrap justify-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (dayName, dayIndex) => {
            const isToday = dayIndex === dayInWeek;
            const dayWorkout = plan.schedule[weekNumber]?.[dayIndex];
            const isRest = dayWorkout?.toLowerCase() === "rest";

            return (
              <View
                key={dayIndex}
                className={`rounded-lg px-3 py-2 mr-2 mb-2 ${
                  isToday
                    ? "bg-blue-600"
                    : isRest
                      ? "bg-gray-200"
                      : "bg-green-100"
                }`}
              >
                <Text
                  className={`text-xs mb-1 ${
                    isToday ? "text-blue-100" : "text-gray-600"
                  }`}
                >
                  {dayName}
                </Text>
                <Text
                  className={`text-sm font-semibold ${
                    isToday
                      ? "text-white"
                      : isRest
                        ? "text-gray-600"
                        : "text-green-700"
                  }`}
                >
                  {dayWorkout || "-"}
                </Text>
              </View>
            );
          }
        )}
      </View>
    </View>
  );
};

export default WeekSchedule;
