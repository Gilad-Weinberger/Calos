import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { WorkoutExercise } from "../../../lib/functions/workoutFunctions";

interface WorkoutCardExerciseItemProps {
  exercise: WorkoutExercise;
}

const WorkoutCardExerciseItem: React.FC<WorkoutCardExerciseItemProps> = ({
  exercise,
}) => {
  return (
    <View
      className="bg-gray-50 rounded-xl p-4 mr-2"
      style={{ width: 140, minHeight: 180 }}
    >
      {/* Exercise Type Icon */}
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mb-3 ${
          exercise.exercise_type === "dynamic" ? "bg-blue-100" : "bg-green-100"
        }`}
      >
        <Ionicons
          name={exercise.exercise_type === "dynamic" ? "flash" : "time"}
          size={20}
          color={exercise.exercise_type === "dynamic" ? "#3B82F6" : "#22C55E"}
        />
      </View>

      {/* Exercise Name */}
      <Text
        className="text-base font-semibold text-gray-800 mb-2"
        numberOfLines={2}
      >
        {exercise.exercise_name}
      </Text>

      {/* Sets and Reps */}
      <View className="flex-1 justify-end">
        <Text className="text-xs text-gray-500 mb-1">
          {exercise.sets} {exercise.sets === 1 ? "set" : "sets"}
        </Text>
        <Text className="text-sm font-medium text-gray-700">
          {(() => {
            const allSame = exercise.reps.every(
              (rep: number) => rep === exercise.reps[0]
            );
            const unit =
              exercise.exercise_type === "static" ? "seconds" : "reps";

            if (allSame && exercise.reps.length > 1) {
              return `${exercise.sets} × ${exercise.reps[0]} ${unit}`;
            } else {
              return `${exercise.reps.join(", ")} ${unit}`;
            }
          })()}
        </Text>
      </View>
    </View>
  );
};

export default WorkoutCardExerciseItem;


