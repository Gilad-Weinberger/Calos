import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

interface CompletedWorkoutCardProps {
  workout: {
    workoutLetter: string;
    workoutName: string;
    scheduledDate: Date;
    dayName: string;
    dayIndex: number;
    exerciseCount: number;
  };
}

const CompletedWorkoutCard: React.FC<CompletedWorkoutCardProps> = ({ workout }) => {
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
    const dayNameShort = workout.dayName.substring(0, 3);
    return `${dayNameShort}, ${month} ${day}`;
  };

  // Extract distance from workout name
  const extractDistance = (workoutName: string): number | null => {
    const distanceMatch = workoutName.match(/(\d+\.?\d*)\s*km/i);
    if (distanceMatch) {
      return parseFloat(distanceMatch[1]);
    }
    return null;
  };

  // Calculate estimated duration (rough estimate: 25-30 min for most workouts)
  const getDurationRange = (): string => {
    // For running workouts, estimate based on distance
    const distance = extractDistance(workout.workoutName);
    if (distance) {
      // Rough estimate: 5-6 min per km for walk-run
      const minMinutes = Math.round(distance * 5);
      const maxMinutes = Math.round(distance * 6);
      return `${minMinutes}m - ${maxMinutes}m`;
    }
    // For strength workouts, estimate based on exercise count
    // Rough estimate: 3-4 min per exercise
    const minMinutes = workout.exerciseCount * 3;
    const maxMinutes = workout.exerciseCount * 4;
    return `${minMinutes}m - ${maxMinutes}m`;
  };

  return (
    <View
      className="bg-white rounded-2xl mb-4 flex-row items-center overflow-hidden"
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
      {/* Left: Color bar */}
      <LinearGradient
        colors={["#1e40af", "#2563eb", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="w-4 h-full"
        style={{ borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
      />

      {/* Center: Workout details */}
      <View className="flex-1 p-4">
        <Text className="text-gray-500 text-sm font-medium mb-1">
          {formatDate(workout.scheduledDate)} •{" "}
          <Text className="font-normal">{getDurationRange()}</Text>
        </Text>
        <Text className="text-gray-900 text-xl font-bold mb-3">
          {workout.workoutName}
        </Text>
        <Text className="text-gray-500 text-sm">
          <Text className="font-semibold">Strength</Text> ·{" "}
          {workout.exerciseCount}{" "}
          {workout.exerciseCount === 1 ? "exercise" : "exercises"}
        </Text>
      </View>

      {/* Right: Checkbox placeholder */}
      <View className="mr-4">
        <View className="w-6 h-6 rounded border-2 border-gray-300" />
      </View>
    </View>
  );
};

export default CompletedWorkoutCard;

