import React from "react";
import { Text, View } from "react-native";
import { WorkoutExercise } from "../../lib/functions/workoutFunctions";
import { groupExercisesBySuperset } from "../../lib/utils/superset";
import EditableExerciseItem from "./EditableExerciseItem";

interface WorkoutEditExerciseListProps {
  exercises: WorkoutExercise[];
  onExerciseUpdate: (index: number, updatedExercise: WorkoutExercise) => void;
  onExerciseRemove: (index: number) => void;
}

const WorkoutEditExerciseList: React.FC<WorkoutEditExerciseListProps> = ({
  exercises,
  onExerciseUpdate,
  onExerciseRemove,
}) => {
  // Format rest time in mm:ss format
  const formatRestTime = (seconds: number): string => {
    if (seconds === 0) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
      : `${seconds}s`;
  };

  // Group exercises by superset
  const exerciseGroups = groupExercisesBySuperset(exercises);

  // Create a map to find original exercise indices
  const exerciseIndexMap = new Map<WorkoutExercise, number>();
  exercises.forEach((exercise, index) => {
    exerciseIndexMap.set(exercise, index);
  });

  return (
    <View>
      <Text className="text-base font-medium text-gray-900 mb-3">
        Exercises
      </Text>
      <View className="space-y-4">
        {exerciseGroups.map((group, groupIndex) => {
          if (group.isSuperset) {
            return (
              <View
                key={`superset-${groupIndex}`}
                className="border-l-4 border-blue-500 pl-4 bg-blue-50 rounded-r-xl mb-4 py-3"
              >
                <Text className="text-xs font-bold text-blue-600 mb-3 uppercase tracking-wide">
                  Superset
                </Text>
                {group.exercises.map((exercise, exIndex) => {
                  const originalIndex = exerciseIndexMap.get(exercise);
                  if (originalIndex === undefined) return null;

                  return (
                    <View key={exIndex} className="mb-3 last:mb-0">
                      <EditableExerciseItem
                        exercise={exercise}
                        onUpdate={(updatedExercise) =>
                          onExerciseUpdate(originalIndex, updatedExercise)
                        }
                        onRemove={() => onExerciseRemove(originalIndex)}
                      />
                    </View>
                  );
                })}
                <Text className="text-xs text-blue-600 mt-2 italic">
                  No rest between exercises •{" "}
                  {formatRestTime(
                    (group.exercises[0] as any)?.rest_seconds || 0
                  )}{" "}
                  rest after superset
                </Text>
              </View>
            );
          } else {
            const exercise = group.exercises[0];
            const originalIndex = exerciseIndexMap.get(exercise);
            if (originalIndex === undefined) return null;

            return (
              <View
                key={`exercise-${groupIndex}`}
                className="border-l-4 border-green-500 pl-4 bg-green-50 rounded-r-xl mb-4 py-3"
              >
                <Text className="text-xs font-bold text-green-600 mb-2 uppercase tracking-wide">
                  Exercise
                </Text>
                <EditableExerciseItem
                  exercise={exercise}
                  onUpdate={(updatedExercise) =>
                    onExerciseUpdate(originalIndex, updatedExercise)
                  }
                  onRemove={() => onExerciseRemove(originalIndex)}
                />
                {(exercise as any).rest_seconds > 0 && (
                  <Text className="text-xs text-green-600 mt-2 italic">
                    {formatRestTime((exercise as any).rest_seconds)} rest
                  </Text>
                )}
              </View>
            );
          }
        })}
      </View>
    </View>
  );
};

export default WorkoutEditExerciseList;
