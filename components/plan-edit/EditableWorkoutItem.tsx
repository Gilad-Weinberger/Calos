import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  ExerciseDefinition,
  WorkoutDefinition,
} from "../../lib/functions/planFunctions";
import EditablePlanExerciseItem from "./EditablePlanExerciseItem";

interface EditableWorkoutItemProps {
  workoutLetter: string;
  workout: WorkoutDefinition;
  onUpdate: (updatedWorkout: WorkoutDefinition) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const EditableWorkoutItem: React.FC<EditableWorkoutItemProps> = ({
  workoutLetter,
  workout,
  onUpdate,
  isExpanded,
  onToggleExpand,
}) => {
  const [workoutName, setWorkoutName] = useState(workout.name);

  const handleNameChange = (value: string) => {
    setWorkoutName(value);
    onUpdate({
      ...workout,
      name: value,
    });
  };

  const handleExerciseUpdate = (
    index: number,
    updatedExercise: ExerciseDefinition
  ) => {
    const newExercises = [...workout.exercises];
    newExercises[index] = updatedExercise;
    onUpdate({
      ...workout,
      exercises: newExercises,
    });
  };

  const handleExerciseRemove = (index: number) => {
    const newExercises = workout.exercises.filter((_, i) => i !== index);
    onUpdate({
      ...workout,
      exercises: newExercises,
    });
  };

  const getExerciseType = (
    exercise: ExerciseDefinition
  ): "static" | "dynamic" => {
    // If duration is defined and greater than 0, it's static
    // Otherwise, if reps is defined (or duration is not set), it's dynamic
    if (exercise.duration !== undefined && exercise.duration > 0) {
      return "static";
    }
    return "dynamic";
  };

  // Group exercises by superset while maintaining order
  const groupExercises = () => {
    const groups: {
      type: "solo" | "superset";
      exercises: { exercise: ExerciseDefinition; index: number }[];
    }[] = [];
    const processedIndices = new Set<number>();

    workout.exercises.forEach((exercise, index) => {
      if (processedIndices.has(index)) return;

      const supersetGroup = exercise.superset_group?.trim();

      if (!supersetGroup) {
        // Solo exercise
        groups.push({
          type: "solo",
          exercises: [{ exercise, index }],
        });
        processedIndices.add(index);
      } else {
        // Find all exercises with the same superset group
        const supersetExercises: {
          exercise: ExerciseDefinition;
          index: number;
        }[] = [];
        workout.exercises.forEach((ex, idx) => {
          if (
            ex.superset_group?.trim() === supersetGroup &&
            !processedIndices.has(idx)
          ) {
            supersetExercises.push({ exercise: ex, index: idx });
            processedIndices.add(idx);
          }
        });

        if (supersetExercises.length > 0) {
          groups.push({
            type: "superset",
            exercises: supersetExercises,
          });
        }
      }
    });

    return groups;
  };

  const exerciseGroups = groupExercises();

  return (
    <View className="bg-white rounded-lg border-2 border-gray-300 mb-4 overflow-hidden shadow-sm">
      {/* Workout Header - Always Visible */}
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
        className="bg-blue-50 p-4 flex-row items-center justify-between"
      >
        <View className="flex-1 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
            <Text className="text-white font-bold text-lg">
              {workoutLetter}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {workout.name}
            </Text>
            <Text className="text-sm text-gray-600">
              {workout.exercises.length} exercise
              {workout.exercises.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <Text className="text-gray-500 text-2xl">{isExpanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View className="p-4">
          {/* Workout Name Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Workout Name
            </Text>
            <TextInput
              value={workoutName}
              onChangeText={handleNameChange}
              placeholder="Enter workout name"
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              maxLength={100}
            />
          </View>

          {/* Exercises List */}
          <View className="mb-2">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Exercises
            </Text>
            {workout.exercises.length === 0 ? (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <Text className="text-yellow-800 text-sm">
                  No exercises in this workout. This workout should have at
                  least one exercise.
                </Text>
              </View>
            ) : (
              exerciseGroups.map((group, groupIndex) => {
                if (group.type === "solo") {
                  // Render solo exercise
                  const { exercise, index } = group.exercises[0];
                  return (
                    <EditablePlanExerciseItem
                      key={`solo-${index}`}
                      exercise={exercise}
                      exerciseType={getExerciseType(exercise)}
                      onUpdate={(updated) =>
                        handleExerciseUpdate(index, updated)
                      }
                      onRemove={() => handleExerciseRemove(index)}
                    />
                  );
                } else {
                  // Render superset group
                  return (
                    <View
                      key={`superset-${groupIndex}`}
                      className="mb-3 border-2 border-purple-300 rounded-lg bg-purple-50/30 p-3"
                    >
                      {group.exercises.map(({ exercise, index }, subIndex) => (
                        <View
                          key={`superset-exercise-${index}`}
                          className="mb-2 last:mb-0"
                        >
                          {subIndex > 0 && (
                            <View className="flex-row items-center justify-center my-2">
                              <View className="flex-1 h-[2px] bg-purple-300" />
                              <Text className="mx-2 text-purple-600 font-semibold text-xs">
                                SUPERSET
                              </Text>
                              <View className="flex-1 h-[2px] bg-purple-300" />
                            </View>
                          )}
                          <EditablePlanExerciseItem
                            exercise={exercise}
                            exerciseType={getExerciseType(exercise)}
                            onUpdate={(updated) =>
                              handleExerciseUpdate(index, updated)
                            }
                            onRemove={() => handleExerciseRemove(index)}
                          />
                        </View>
                      ))}
                    </View>
                  );
                }
              })
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default EditableWorkoutItem;
