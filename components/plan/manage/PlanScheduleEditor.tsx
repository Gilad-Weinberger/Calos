import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Plan } from "../../../lib/functions/planFunctions";

interface PlanScheduleEditorProps {
  plan: Plan;
  onScheduleChange: (schedule: string[][]) => void;
}

const PlanScheduleEditor: React.FC<PlanScheduleEditorProps> = ({
  plan,
  onScheduleChange,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    weekIndex: number;
    dayIndex: number;
  } | null>(null);
  const [schedule, setSchedule] = useState<string[][]>(plan.schedule);

  // Update schedule when plan changes
  React.useEffect(() => {
    setSchedule(plan.schedule);
  }, [plan.schedule]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleCellPress = (weekIndex: number, dayIndex: number) => {
    setSelectedCell({ weekIndex, dayIndex });
  };

  const handleWorkoutSelect = (workoutLetter: string) => {
    if (!selectedCell) return;

    const newSchedule = schedule.map((week, wIdx) =>
      week.map((day, dIdx) => {
        if (
          wIdx === selectedCell.weekIndex &&
          dIdx === selectedCell.dayIndex
        ) {
          return workoutLetter;
        }
        return day;
      })
    );

    setSchedule(newSchedule);
    onScheduleChange(newSchedule);
    setSelectedCell(null);
  };

  const handleRestSelect = () => {
    if (!selectedCell) return;

    const newSchedule = schedule.map((week, wIdx) =>
      week.map((day, dIdx) => {
        if (
          wIdx === selectedCell.weekIndex &&
          dIdx === selectedCell.dayIndex
        ) {
          return "Rest";
        }
        return day;
      })
    );

    setSchedule(newSchedule);
    onScheduleChange(newSchedule);
    setSelectedCell(null);
  };

  const getWorkoutLetters = (): string[] => {
    return Object.keys(plan.workouts).sort();
  };

  const getCellContent = (weekIndex: number, dayIndex: number): string => {
    const workoutLetter = schedule[weekIndex]?.[dayIndex];
    if (!workoutLetter || workoutLetter.toLowerCase() === "rest") {
      return "Rest";
    }
    return String(workoutLetter || "");
  };

  const isRestDay = (weekIndex: number, dayIndex: number): boolean => {
    const workoutLetter = schedule[weekIndex]?.[dayIndex];
    return (
      !workoutLetter ||
      workoutLetter.toLowerCase() === "rest" ||
      workoutLetter.trim() === ""
    );
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
      <Text className="text-lg font-semibold text-gray-900 mb-4">
        Schedule
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Day Headers */}
          <View className="flex-row mb-2">
            <View className="w-20" /> {/* Week label column */}
            {dayNames.map((day) => (
              <View
                key={day}
                className="w-16 items-center justify-center px-1"
              >
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
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Select Workout
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

              {/* Workout Options */}
              {getWorkoutLetters().map((letter) => {
                const workout = plan.workouts[letter];
                return (
                  <TouchableOpacity
                    key={letter}
                    onPress={() => handleWorkoutSelect(letter)}
                    className="bg-blue-50 rounded-lg px-4 py-3 mb-2 border border-blue-200"
                  >
                    <Text className="text-base font-bold text-blue-800">
                      {letter}
                    </Text>
                    {workout?.name ? (
                      <Text className="text-sm text-blue-600 mt-1">
                        {workout.name}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setSelectedCell(null)}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <Text className="text-center text-gray-600 font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default PlanScheduleEditor;

