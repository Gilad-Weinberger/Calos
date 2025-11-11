import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const StepWorkoutsPerWeek: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();

  const recommendation = useMemo(() => {
    if (!formData.activityLevel) return null;

    const base = (() => {
      switch (formData.activityLevel) {
        case "beginner":
          return 3;
        case "intermediate":
          return 4;
        case "advanced":
          return 5;
        default:
          return 3;
      }
    })();

    const currentDays = formData.currentWorkoutDays ?? 0;
    const suggested = Math.max(base, currentDays || base);

    return {
      base,
      currentDays,
      suggested: Math.min(suggested, 7),
    };
  }, [formData.activityLevel, formData.currentWorkoutDays]);

  const workoutOptions = useMemo(
    () => Array.from({ length: 7 }, (_, index) => index + 1),
    []
  );

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        How many workouts per week?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        Choose how often you want to work out
      </Text>

      {/* Recommendation */}
      {recommendation && (
        <View className="self-start bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
          <Text className="text-sm font-medium text-blue-700">
            Suggested: {recommendation.suggested} workouts/week
          </Text>
        </View>
      )}

      {/* Number Input */}
      <View className="gap-3">
        {workoutOptions.map((value) => {
          const isSelected = formData.workoutsPerWeek === value;
          return (
            <TouchableOpacity
              key={value}
              onPress={() => updateField("workoutsPerWeek", value)}
              className={`w-full rounded-xl border-2 px-4 py-4 flex-row items-center justify-between ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View className="flex-1">
                <Text
                  className={`text-lg font-semibold ${
                    isSelected ? "text-blue-700" : "text-gray-800"
                  }`}
                >
                  {value} workout{value === 1 ? "" : "s"} per week
                </Text>
              </View>
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={isSelected ? "#2563eb" : "#D1D5DB"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default StepWorkoutsPerWeek;
