import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const StepWorkoutsPerWeek: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();

  const recommendation = useMemo(() => {
    if (!formData.activityLevel) return null;

    const suggestedValue = (() => {
      switch (formData.activityLevel) {
        case "beginner":
          return 2;
        case "intermediate":
          return 4;
        case "advanced":
          return 6;
        default:
          return 2;
      }
    })();

    const suggestedRange = (() => {
      switch (formData.activityLevel) {
        case "beginner":
          return "1-2";
        case "intermediate":
          return "3-4";
        case "advanced":
          return "5-6";
        default:
          return "1-2";
      }
    })();

    return {
      suggestedRange,
      suggestedValue,
    };
  }, [formData.activityLevel]);

  // Auto-select the suggested value if not already set
  useEffect(() => {
    if (recommendation && formData.workoutsPerWeek === null) {
      updateField("workoutsPerWeek", recommendation.suggestedValue);
    }
  }, [recommendation, formData.workoutsPerWeek, updateField]);

  const workoutOptions = useMemo(
    () => [
      { label: "1-2", value: 2 },
      { label: "3-4", value: 4 },
      { label: "5-6", value: 6 },
      { label: "7+", value: 7 },
    ],
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
            Suggested: {recommendation.suggestedRange} workouts
          </Text>
        </View>
      )}

      {/* Number Input */}
      <View className="gap-3">
        {workoutOptions.map((option) => {
          const isSelected = formData.workoutsPerWeek === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => updateField("workoutsPerWeek", option.value)}
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
                  {option.label} workouts
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
