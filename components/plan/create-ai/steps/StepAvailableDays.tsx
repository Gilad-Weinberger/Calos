import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const StepAvailableDays: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();

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

  const minDays = formData.workoutsPerWeek || 0;
  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        Which days can you exercise?
      </Text>
      <Text className="text-base text-gray-600 mb-2">
        Select at least {minDays} day{minDays !== 1 ? "s" : ""} (matching your
        workouts per week)
      </Text>

      <View className="gap-3 mt-2">
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
              <Text
                className={`text-base font-semibold ${
                  selected ? "text-blue-700" : "text-gray-800"
                }`}
              >
                {dayName}
              </Text>
              <View
                className={`w-3 h-3 rounded-full ${
                  selected ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default StepAvailableDays;
