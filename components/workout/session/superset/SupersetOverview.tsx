import React from "react";
import { Text, View } from "react-native";
import { ExerciseDefinition } from "../../../../lib/functions/planFunctions";

interface SupersetOverviewProps {
  supersetExercises: ExerciseDefinition[];
  currentExerciseName: string;
}

const SupersetOverview: React.FC<SupersetOverviewProps> = ({
  supersetExercises,
  currentExerciseName,
}) => {
  return (
    <View className="bg-blue-50 rounded-lg p-3 mb-4 border-l-4 border-blue-500">
      <Text className="text-xs font-semibold text-blue-600 mb-2">
        Superset Exercises:
      </Text>
      {supersetExercises.map((ex, idx) => (
        <Text
          key={idx}
          className={`text-sm ${
            ex.exercise_name === currentExerciseName
              ? "font-bold text-blue-900"
              : "text-blue-700"
          }`}
        >
          {idx + 1}. {ex.exercise_name} ({ex.sets}×
          {ex.duration ? `${ex.duration}s` : ex.reps})
        </Text>
      ))}
      <Text className="text-xs text-blue-600 mt-2 italic">
        No rest between exercises
      </Text>
    </View>
  );
};

export default SupersetOverview;


