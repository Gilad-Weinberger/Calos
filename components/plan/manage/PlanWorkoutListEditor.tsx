import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { Plan } from "../../../lib/functions/planFunctions";

interface PlanWorkoutListEditorProps {
  plan: Plan;
}

const PlanWorkoutListEditor: React.FC<PlanWorkoutListEditorProps> = ({
  plan,
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

  const workoutLetters = Object.keys(plan.workouts).sort();

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
        <View className="bg-blue-50 px-3 py-1 rounded-lg">
          <Text className="text-blue-600 text-xs font-medium">View Only</Text>
        </View>
      </View>

      {workoutLetters.length === 0 ? (
        <View className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <View className="items-center">
            <Ionicons name="barbell-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 text-center mt-3 font-medium">
              No workouts defined yet
            </Text>
            <Text className="text-gray-500 text-center mt-2 text-sm">
              Use the AI Assistant button to modify your plan
            </Text>
          </View>
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
                      {workout.exercises.length === 1
                        ? "exercise"
                        : "exercises"}
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
                  <View>
                    {workout.exercises.map((exercise, index) => (
                      <View key={index} className="flex-row items-center mb-2">
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
