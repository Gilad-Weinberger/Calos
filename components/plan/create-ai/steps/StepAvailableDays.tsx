import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const StepAvailableDays: React.FC = () => {
  const { formData, updateField, validateStep } = useCreatePlanAIForm();

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const toggleDay = (dayIndex: number) => {
    const currentDays = [...formData.availableDays];
    const index = currentDays.indexOf(dayIndex);

    if (index > -1) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(dayIndex);
      currentDays.sort((a, b) => a - b);
    }

    updateField("availableDays", currentDays);
  };

  const isDaySelected = (dayIndex: number) => {
    return formData.availableDays.includes(dayIndex);
  };

  const isValid = validateStep(6);
  const minDays = formData.workoutsPerWeek || 0;
  const selectedCount = formData.availableDays.length;

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        Which days can you exercise?
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Select at least {minDays} day{minDays !== 1 ? "s" : ""} (matching your
        workouts per week)
      </Text>
      {!isValid && selectedCount > 0 && (
        <Text className="text-sm text-red-600 mb-4">
          You must select at least {minDays} day{minDays !== 1 ? "s" : ""}{" "}
          (matching your workouts per week)
        </Text>
      )}

      <View className="gap-3 mb-6">
        {dayNames.map((dayName, dayIndex) => {
          const selected = isDaySelected(dayIndex);
          return (
            <TouchableOpacity
              key={dayIndex}
              onPress={() => toggleDay(dayIndex)}
              className={`w-full rounded-xl border-2 px-4 py-4 flex-row items-center justify-between ${
                selected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View>
                <Text
                  className={`text-base font-semibold ${
                    selected ? "text-blue-700" : "text-gray-800"
                  }`}
                >
                  {dayName}
                </Text>
                <Text className="text-xs text-gray-500">
                  {selected ? "Selected" : "Tap to add"}
                </Text>
              </View>
              <View
                className={`w-3 h-3 rounded-full ${
                  selected ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedCount > 0 && (
        <View className="bg-gray-50 rounded-lg p-4">
          <Text className="text-sm text-gray-600 text-center">
            <Text className="font-semibold">{selectedCount}</Text> day
            {selectedCount !== 1 ? "s" : ""} selected
          </Text>
        </View>
      )}
    </View>
  );
};

export default StepAvailableDays;
