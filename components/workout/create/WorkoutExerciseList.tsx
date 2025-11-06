import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { WorkoutExercise } from "../../../lib/functions/workoutFunctions";
import ExerciseSetInput from "./ExerciseSetInput";
import WorkoutSupersetIndicator from "./WorkoutSupersetIndicator";

interface WorkoutExerciseListProps {
  exercises: WorkoutExercise[];
  selectedForSuperset: number[];
  onExerciseUpdate: (index: number, exercise: WorkoutExercise) => void;
  onExerciseRemove: (index: number) => void;
  onToggleSelection: (index: number) => void;
  onCreateSuperset: () => void;
  onRemoveFromSuperset: (index: number) => void;
}

const WorkoutExerciseList: React.FC<WorkoutExerciseListProps> = ({
  exercises,
  selectedForSuperset,
  onExerciseUpdate,
  onExerciseRemove,
  onToggleSelection,
  onCreateSuperset,
  onRemoveFromSuperset,
}) => {
  if (exercises.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm font-medium text-gray-700">
          Exercises ({exercises.length})
        </Text>
        {selectedForSuperset.length > 0 && (
          <TouchableOpacity
            onPress={onCreateSuperset}
            className="bg-blue-600 rounded-lg px-3 py-2"
          >
            <Text className="text-white text-xs font-semibold">
              Create Superset ({selectedForSuperset.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {exercises.map((exercise, index) => (
        <View key={`${exercise.exercise_id}-${index}`}>
          {/* Superset Indicator */}
          {exercise.superset_group && (
            <WorkoutSupersetIndicator
              supersetGroup={exercise.superset_group}
              onRemove={() => onRemoveFromSuperset(index)}
            />
          )}

          <View className="flex-row items-center">
            {/* Selection Checkbox */}
            {!exercise.superset_group && (
              <TouchableOpacity
                onPress={() => onToggleSelection(index)}
                className="mr-2"
              >
                <View
                  className={`w-6 h-6 border-2 rounded items-center justify-center ${
                    selectedForSuperset.includes(index)
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedForSuperset.includes(index) && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            )}

            <View className="flex-1">
              <ExerciseSetInput
                exercise={exercise}
                onUpdate={(updatedExercise) =>
                  onExerciseUpdate(index, updatedExercise)
                }
                onRemove={() => onExerciseRemove(index)}
              />
            </View>
          </View>
        </View>
      ))}

      {/* Instructions */}
      {exercises.length >= 2 && selectedForSuperset.length === 0 && (
        <View className="bg-gray-100 rounded-lg p-3 mt-2">
          <Text className="text-xs text-gray-600">
            💡 Tip: Select 2 or more exercises using the checkboxes to create a
            superset (exercises performed back-to-back without rest)
          </Text>
        </View>
      )}
    </View>
  );
};

export default WorkoutExerciseList;

