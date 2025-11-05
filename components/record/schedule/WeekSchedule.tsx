import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";
import { Plan } from "../../../lib/functions/planFunctions";

interface WeekScheduleProps {
  plan: Plan;
  weekNumber: number;
  selectedDayIndex: number;
  onDaySelect: (dayIndex: number) => void;
  weekStartDate: Date;
}

const WeekSchedule: React.FC<WeekScheduleProps> = ({
  plan,
  weekNumber,
  selectedDayIndex,
  onDaySelect,
  weekStartDate,
}) => {
  // Day names starting from Sunday
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Animated value for the circle position (in pixels)
  const slideAnim = useRef(new Animated.Value(0)).current;
  const containerWidthRef = useRef(0);

  // Animate when selectedDayIndex changes
  useEffect(() => {
    if (containerWidthRef.current > 0) {
      // Calculate the center position of the selected day
      const dayWidth = containerWidthRef.current / 7;
      const targetPosition = dayWidth * selectedDayIndex + dayWidth / 2 - 16; // 16 is half of circle width (32/2)

      Animated.timing(slideAnim, {
        toValue: targetPosition,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [selectedDayIndex, slideAnim]);

  // Get workout for a specific day
  const getDayWorkout = (dayIndex: number) => {
    const weekSchedule = plan.schedule[weekNumber] || [];
    return weekSchedule[dayIndex];
  };

  // Calculate date for a day in the week
  const getDateForDay = (dayIndex: number): number => {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + dayIndex);
    return date.getDate();
  };

  return (
    <View className="bg-white p-4">
      <View
        className="flex-row justify-between px-1 relative"
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          if (width > 0) {
            containerWidthRef.current = width;
            // Initialize position on first layout
            const dayWidth = width / 7;
            const initialPosition =
              dayWidth * selectedDayIndex + dayWidth / 2 - 16;
            slideAnim.setValue(initialPosition);
          }
        }}
      >
        {/* Animated background circle */}
        <Animated.View
          style={{
            position: "absolute",
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#000",
            top: 20, // Position below day name (mb-2 = 8px, text height ~12px, so ~20px)
            transform: [{ translateX: slideAnim }],
            left: 0,
          }}
          pointerEvents="none"
        />

        {dayNames.map((dayName, dayIndex) => {
          const workoutLetter = getDayWorkout(dayIndex);
          const isRest =
            !workoutLetter ||
            workoutLetter.toLowerCase() === "rest" ||
            workoutLetter.trim() === "";
          const isSelected = dayIndex === selectedDayIndex;

          return (
            <TouchableOpacity
              key={dayIndex}
              onPress={() => onDaySelect(dayIndex)}
              className="items-center flex-1"
            >
              {/* Day Name */}
              <Text className="text-xs font-medium mb-2 text-gray-500">
                {dayName}
              </Text>

              {/* Date Number */}
              <View
                className="w-8 h-8 rounded-full items-center justify-center mb-1 bg-transparent"
                style={{ borderRadius: 100 }}
              >
                <Text
                  className={`text-base font-semibold ${
                    isSelected ? "text-white" : "text-gray-900"
                  }`}
                >
                  {getDateForDay(dayIndex)}
                </Text>
              </View>

              {/* Workout Blocks */}
              <View
                className="flex-row gap-1 justify-center"
                style={{ minHeight: 10 }}
              >
                {!isRest && workoutLetter && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: "#3b82f6",
                    }}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default WeekSchedule;
