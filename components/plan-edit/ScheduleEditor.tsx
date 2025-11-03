import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface ScheduleEditorProps {
  schedule: string[][];
  numWeeks: number;
  availableWorkouts: string[]; // e.g., ["A", "B", "C"]
  onScheduleChange: (newSchedule: string[][]) => void;
}

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  schedule,
  numWeeks,
  availableWorkouts,
  onScheduleChange,
}) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Color mapping for workouts
  const getColorForWorkout = (workout: string): string => {
    if (workout.toLowerCase() === "rest") return "bg-gray-200";
    
    const colors = [
      "bg-blue-200",
      "bg-green-200",
      "bg-purple-200",
      "bg-orange-200",
      "bg-pink-200",
      "bg-indigo-200",
      "bg-yellow-200",
    ];
    
    const index = availableWorkouts.indexOf(workout);
    return index >= 0 ? colors[index % colors.length] : "bg-gray-200";
  };

  const getTextColorForWorkout = (workout: string): string => {
    if (workout.toLowerCase() === "rest") return "text-gray-700";
    
    const colors = [
      "text-blue-800",
      "text-green-800",
      "text-purple-800",
      "text-orange-800",
      "text-pink-800",
      "text-indigo-800",
      "text-yellow-800",
    ];
    
    const index = availableWorkouts.indexOf(workout);
    return index >= 0 ? colors[index % colors.length] : "text-gray-700";
  };

  const handleCellTap = (weekIndex: number, dayIndex: number) => {
    const currentValue = schedule[weekIndex][dayIndex];
    
    // Cycle through: Rest -> A -> B -> C -> ... -> Rest
    const options = ["Rest", ...availableWorkouts];
    const currentIndex = options.findIndex(
      (opt) => opt.toLowerCase() === currentValue.toLowerCase()
    );
    const nextIndex = (currentIndex + 1) % options.length;
    const nextValue = options[nextIndex];

    // Update schedule
    const newSchedule = schedule.map((week, wIdx) =>
      wIdx === weekIndex
        ? week.map((day, dIdx) => (dIdx === dayIndex ? nextValue : day))
        : week
    );

    onScheduleChange(newSchedule);
  };

  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-2">
        Weekly Schedule
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        Tap cells to cycle through workouts. Each week follows the pattern from
        Sunday to Saturday.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row - Day Names */}
          <View className="flex-row mb-2">
            <View className="w-16 h-10 items-center justify-center">
              <Text className="text-xs font-semibold text-gray-600">Week</Text>
            </View>
            {dayNames.map((day, index) => (
              <View
                key={index}
                className="w-14 h-10 items-center justify-center"
              >
                <Text className="text-xs font-semibold text-gray-600">
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Schedule Rows */}
          {schedule.map((week, weekIndex) => (
            <View key={weekIndex} className="flex-row mb-2">
              {/* Week Number */}
              <View className="w-16 h-12 items-center justify-center">
                <Text className="text-sm font-semibold text-gray-700">
                  {weekIndex + 1}
                </Text>
              </View>

              {/* Days */}
              {week.map((workout, dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  onPress={() => handleCellTap(weekIndex, dayIndex)}
                  className={`w-14 h-12 mx-0.5 rounded-lg items-center justify-center border border-gray-300 ${getColorForWorkout(
                    workout
                  )}`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-sm font-bold ${getTextColorForWorkout(
                      workout
                    )}`}
                  >
                    {workout.toLowerCase() === "rest"
                      ? "—"
                      : workout.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View className="mt-4 p-3 bg-gray-50 rounded-lg">
        <Text className="text-xs font-semibold text-gray-700 mb-2">
          Legend:
        </Text>
        <View className="flex-row flex-wrap">
          <View className="flex-row items-center mr-4 mb-2">
            <View className="w-6 h-6 rounded bg-gray-200 mr-2" />
            <Text className="text-xs text-gray-600">Rest</Text>
          </View>
          {availableWorkouts.map((workout, index) => (
            <View key={workout} className="flex-row items-center mr-4 mb-2">
              <View
                className={`w-6 h-6 rounded ${getColorForWorkout(workout)} mr-2`}
              />
              <Text className="text-xs text-gray-600">Workout {workout}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default ScheduleEditor;

