import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const currentDayOptions = Array.from({ length: 8 }, (_, index) => index);

const StepCurrentTrainingDays: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        How often do you train now?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        Pick the number of workouts you already complete each week.
      </Text>

      <View className="gap-3">
        {currentDayOptions.map((daysPerWeek) => {
          const isSelected = formData.currentWorkoutDays === daysPerWeek;
          return (
            <TouchableOpacity
              key={daysPerWeek}
              onPress={() => updateField("currentWorkoutDays", daysPerWeek)}
              className={`w-full px-4 py-4 rounded-lg border-2 ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
              activeOpacity={0.85}
            >
              <Text
                className={`text-base font-semibold ${
                  isSelected ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {daysPerWeek} day{daysPerWeek === 1 ? "" : "s"} a week
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="text-xs text-gray-500 mt-6">
        Being realistic helps the AI adapt your new plan to your current
        capacity.
      </Text>
    </View>
  );
};

export default StepCurrentTrainingDays;

