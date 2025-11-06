import React from "react";
import { Text, View } from "react-native";
import { WorkoutExercise } from "../../../lib/functions/workoutFunctions";

interface WorkoutCardSupersetItemProps {
  exercises: WorkoutExercise[];
  supersetGroup: string;
}

const WorkoutCardSupersetItem: React.FC<WorkoutCardSupersetItemProps> = ({
  exercises,
  supersetGroup,
}) => {
  return (
    <View
      className="bg-blue-50 rounded-xl p-4 mr-2 border-2 border-blue-200"
      style={{ width: 160, minHeight: 180 }}
    >
      {/* Superset Badge */}
      <View className="bg-blue-600 rounded-full px-2 py-1 self-start mb-2">
        <Text className="text-xs font-bold text-white">SUPERSET {supersetGroup}</Text>
      </View>

      {/* Exercises in Superset */}
      {exercises.map((exercise, exIndex) => (
        <View key={exIndex} className="mb-2">
          <Text
            className="text-sm font-semibold text-gray-800"
            numberOfLines={1}
          >
            {exercise.exercise_name}
          </Text>
          <Text className="text-xs text-gray-600">
            {exercise.sets}×
            {(() => {
              const allSame = exercise.reps.every(
                (rep: number) => rep === exercise.reps[0]
              );
              const unit =
                exercise.exercise_type === "static" ? "s" : "";
              if (allSame) {
                return `${exercise.reps[0]}${unit}`;
              }
              return exercise.reps.join("-") + unit;
            })()}
          </Text>
        </View>
      ))}
      <Text className="text-xs text-blue-600 mt-1 italic">No rest between</Text>
    </View>
  );
};

export default WorkoutCardSupersetItem;

