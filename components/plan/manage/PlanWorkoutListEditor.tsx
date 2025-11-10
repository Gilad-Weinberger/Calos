import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import type {
  Plan,
  WorkoutDefinition,
} from "../../../lib/functions/planFunctions";

interface PlanWorkoutListEditorProps {
  plan: Plan;
  onWorkoutEdit: (workoutLetter: string, workout: WorkoutDefinition) => void;
  onWorkoutDelete: (workoutLetter: string) => void;
  onWorkoutAdd: () => void;
}

const PlanWorkoutListEditor: React.FC<PlanWorkoutListEditorProps> = ({
  plan,
  onWorkoutEdit,
  onWorkoutDelete,
  onWorkoutAdd,
}) => {
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(
    new Set()
  );

  const toggleExpand = (workoutLetter: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutLetter)) {
      newExpanded.delete(workoutLetter);
    } else {
      newExpanded.add(workoutLetter);
    }
    setExpandedWorkouts(newExpanded);
  };

  const handleDelete = (workoutLetter: string) => {
    Alert.alert(
      "Delete Workout",
      `Delete workout "${workoutLetter}"? It will be removed from the schedule.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onWorkoutDelete(workoutLetter),
        },
      ]
    );
  };

  const workoutLetters = Object.keys(plan.workouts).sort();

  const getNextWorkoutLetter = (): string => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (const letter of letters) {
      if (!plan.workouts[letter]) {
        return letter;
      }
    }
    return "Z";
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
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">Workouts</Text>
        <TouchableOpacity
          onPress={onWorkoutAdd}
          className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-semibold ml-1">Add Workout</Text>
        </TouchableOpacity>
      </View>

      {workoutLetters.length === 0 ? (
        <View className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <Text className="text-gray-500 text-center">
            No workouts defined. Add your first workout to get started.
          </Text>
        </View>
      ) : (
        workoutLetters.map((letter) => {
          const workout = plan.workouts[letter];
          const isExpanded = expandedWorkouts.has(letter);

          return (
            <View
              key={letter}
              className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200"
            >
              {/* Workout Header */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Text className="text-blue-800 font-bold text-lg">
                      {letter}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {workout.name}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {workout.exercises.length}{" "}
                      {workout.exercises.length === 1 ? "exercise" : "exercises"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => toggleExpand(letter)}
                  className="p-2"
                >
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#6B7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Expanded Content */}
              {isExpanded && (
                <View className="mt-4 pt-4 border-t border-gray-200">
                  {/* Exercise List Preview */}
                  <View className="mb-4">
                    {workout.exercises.slice(0, 3).map((exercise, index) => (
                      <View
                        key={index}
                        className="flex-row items-center mb-2"
                      >
                        <View className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                        <Text className="text-sm text-gray-700 flex-1">
                          {exercise.exercise_name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {exercise.sets} sets
                          {exercise.reps
                            ? ` × ${exercise.reps} reps`
                            : exercise.duration
                            ? ` × ${exercise.duration}s`
                            : ""}
                        </Text>
                      </View>
                    ))}
                    {workout.exercises.length > 3 && (
                      <Text className="text-xs text-gray-500 mt-2">
                        +{workout.exercises.length - 3} more exercises
                      </Text>
                    )}
                  </View>

                  {/* Actions */}
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => onWorkoutEdit(letter, workout)}
                      className="flex-1 bg-blue-600 rounded-lg px-4 py-2 flex-row items-center justify-center"
                    >
                      <Ionicons name="create-outline" size={16} color="white" />
                      <Text className="text-white font-semibold ml-1">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(letter)}
                      className="flex-1 bg-red-500 rounded-lg px-4 py-2 flex-row items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={16} color="white" />
                      <Text className="text-white font-semibold ml-1">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
};

export default PlanWorkoutListEditor;

