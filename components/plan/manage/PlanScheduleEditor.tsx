import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import type { Plan } from "../../../lib/functions/planFunctions";

interface PlanScheduleEditorProps {
  plan: Plan;
  onScheduleChange: (schedule: (string | string[])[][]) => void;
}

const PlanScheduleEditor: React.FC<PlanScheduleEditorProps> = ({
  plan,
  onScheduleChange,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    weekIndex: number;
    dayIndex: number;
  } | null>(null);
  const [schedule, setSchedule] = useState<(string | string[])[][]>(
    plan.schedule
  );
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);

  // Update schedule when plan changes
  React.useEffect(() => {
    setSchedule(plan.schedule);
  }, [plan.schedule]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleCellPress = (weekIndex: number, dayIndex: number) => {
    setSelectedCell({ weekIndex, dayIndex });

    // Load currently selected workouts for this cell
    const cellValue = schedule[weekIndex]?.[dayIndex];
    if (cellValue) {
      let currentWorkouts = Array.isArray(cellValue) ? cellValue : [cellValue];

      // Handle comma-separated strings
      currentWorkouts = currentWorkouts.flatMap((w) => {
        if (typeof w === "string" && w.includes(",")) {
          return w.split(",").map((l) => l.trim());
        }
        return w;
      });

      const nonRestWorkouts = currentWorkouts.filter(
        (w) => w && w.toLowerCase() !== "rest"
      );
      setSelectedWorkouts(nonRestWorkouts);
    } else {
      setSelectedWorkouts([]);
    }
  };

  const handleWorkoutToggle = (workoutLetter: string) => {
    // Toggle workout selection
    setSelectedWorkouts((prev) => {
      if (prev.includes(workoutLetter)) {
        return prev.filter((w) => w !== workoutLetter);
      } else {
        return [...prev, workoutLetter];
      }
    });
  };

  const handleApplySelection = () => {
    if (!selectedCell) return;

    const newSchedule = schedule.map((week, wIdx) =>
      week.map((day, dIdx) => {
        if (wIdx === selectedCell.weekIndex && dIdx === selectedCell.dayIndex) {
          // If multiple workouts selected, store as array; if one, store as string
          if (selectedWorkouts.length === 0) {
            return "Rest";
          } else if (selectedWorkouts.length === 1) {
            return selectedWorkouts[0];
          } else {
            return selectedWorkouts;
          }
        }
        return day;
      })
    );

    setSchedule(newSchedule);
    onScheduleChange(newSchedule);
    setSelectedCell(null);
    setSelectedWorkouts([]);
  };

  const handleRestSelect = () => {
    if (!selectedCell) return;

    const newSchedule = schedule.map((week, wIdx) =>
      week.map((day, dIdx) => {
        if (wIdx === selectedCell.weekIndex && dIdx === selectedCell.dayIndex) {
          return "Rest";
        }
        return day;
      })
    );

    setSchedule(newSchedule);
    onScheduleChange(newSchedule);
    setSelectedCell(null);
    setSelectedWorkouts([]);
  };

  const getWorkoutLetters = (): string[] => {
    return Object.keys(plan.workouts).sort();
  };

  const getCellContent = (weekIndex: number, dayIndex: number): string => {
    const cellValue = schedule[weekIndex]?.[dayIndex];
    if (!cellValue) return "Rest";

    // Handle array of workouts
    if (Array.isArray(cellValue)) {
      const nonRest = cellValue.filter((w) => w && w.toLowerCase() !== "rest");
      return nonRest.length > 0 ? nonRest.join(", ") : "Rest";
    }

    // Handle single workout
    if (cellValue.toLowerCase() === "rest") {
      return "Rest";
    }
    return String(cellValue || "");
  };

  const isRestDay = (weekIndex: number, dayIndex: number): boolean => {
    const cellValue = schedule[weekIndex]?.[dayIndex];
    if (!cellValue) return true;

    // Handle array of workouts
    if (Array.isArray(cellValue)) {
      return cellValue.every((w) => !w || w.toLowerCase() === "rest");
    }

    // Handle string (including comma-separated)
    if (typeof cellValue === "string") {
      // Split by comma if needed and check if all are rest
      const letters = cellValue.includes(",")
        ? cellValue.split(",").map((l) => l.trim())
        : [cellValue];
      return letters.every(
        (l) => l.toLowerCase() === "rest" || l.trim() === ""
      );
    }

    return true;
  };

  const getWorkoutName = (workoutLetter: string): string => {
    const workout = plan.workouts[workoutLetter];
    return workout?.name || workoutLetter || "";
  };

  return (
    <View
      className="bg-white rounded-xl p-6 mb-6 border border-gray-200"
      style={{
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Text className="text-lg font-semibold text-gray-900 mb-4">Schedule</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Day Headers */}
          <View className="flex-row mb-2">
            <View className="w-20" /> {/* Week label column */}
            {dayNames.map((day) => (
              <View key={day} className="w-16 items-center justify-center px-1">
                <Text className="text-xs font-semibold text-gray-700">
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Week Rows */}
          {Array.from({ length: plan.num_weeks }).map((_, weekIndex) => (
            <View key={weekIndex} className="flex-row mb-2">
              {/* Week Label */}
              <View className="w-20 items-center justify-center pr-2">
                <Text className="text-sm font-semibold text-gray-900">
                  Week {weekIndex + 1}
                </Text>
              </View>

              {/* Day Cells */}
              {dayNames.map((_, dayIndex) => {
                const content = getCellContent(weekIndex, dayIndex);
                const isRest = isRestDay(weekIndex, dayIndex);

                return (
                  <TouchableOpacity
                    key={dayIndex}
                    onPress={() => handleCellPress(weekIndex, dayIndex)}
                    className="w-16 h-16 mx-1 rounded-lg border border-gray-200 items-center justify-center"
                    style={{
                      backgroundColor: isRest ? "#F3F4F6" : "#EFF6FF",
                      minHeight: 60,
                    }}
                  >
                    {!isRest ? (
                      <View className="items-center">
                        {content ? (
                          <Text className="text-xs font-bold text-blue-800">
                            {content}
                          </Text>
                        ) : null}
                        {getWorkoutName(content) ? (
                          <Text
                            className="text-[10px] text-blue-600 mt-0.5"
                            numberOfLines={1}
                          >
                            {getWorkoutName(content)}
                          </Text>
                        ) : null}
                      </View>
                    ) : (
                      <Text className="text-xs text-gray-500">Rest</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Picker Modal */}
      <Modal
        visible={selectedCell !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCell(null)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 items-center justify-center px-4"
          activeOpacity={1}
          onPress={() => setSelectedCell(null)}
        >
          <View
            className="bg-white rounded-xl p-6 w-full max-w-sm"
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Select Workout(s)
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Tap to select multiple workouts for this day
            </Text>

            <ScrollView className="max-h-64">
              {/* Rest Option */}
              <TouchableOpacity
                onPress={handleRestSelect}
                className="bg-gray-100 rounded-lg px-4 py-3 mb-2"
              >
                <Text className="text-base font-medium text-gray-900">
                  Rest Day
                </Text>
              </TouchableOpacity>

              {/* Workout Options with checkboxes */}
              {getWorkoutLetters().map((letter) => {
                const workout = plan.workouts[letter];
                const isSelected = selectedWorkouts.includes(letter);
                return (
                  <TouchableOpacity
                    key={letter}
                    onPress={() => handleWorkoutToggle(letter)}
                    className={`rounded-lg px-4 py-3 mb-2 border ${
                      isSelected
                        ? "bg-blue-100 border-blue-400"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                          isSelected
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-400"
                        }`}
                      >
                        {isSelected && (
                          <Text className="text-white text-xs font-bold">
                            ✓
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-blue-800">
                          {letter}
                        </Text>
                        {workout?.name ? (
                          <Text className="text-sm text-blue-600 mt-1">
                            {workout.name}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Action Buttons */}
            <View className="mt-4 pt-4 border-t border-gray-200 flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  setSelectedCell(null);
                  setSelectedWorkouts([]);
                }}
                className="flex-1 py-3 rounded-lg bg-gray-100"
              >
                <Text className="text-center text-gray-700 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApplySelection}
                className="flex-1 py-3 rounded-lg bg-blue-600"
              >
                <Text className="text-center text-white font-medium">
                  Apply{" "}
                  {selectedWorkouts.length > 0 &&
                    `(${selectedWorkouts.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default PlanScheduleEditor;
