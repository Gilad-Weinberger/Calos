import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

interface ActivityLevelCardProps {
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  isSelected: boolean;
  onSelect: () => void;
}

const ActivityLevelCard: React.FC<ActivityLevelCardProps> = ({
  title,
  description,
  level,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      onPress={onSelect}
      className={`bg-white rounded-xl p-6 border-2 mb-4 ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
    >
      <Text className="text-xl font-bold text-gray-900 mb-2">{title}</Text>
      <Text className="text-sm text-gray-600">{description}</Text>
    </TouchableOpacity>
  );
};

const StepActivityLevel: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        What&apos;s your experience level?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        Help us understand your current fitness level
      </Text>

      <ActivityLevelCard
        title="Beginner"
        description="I'm new to calisthenics or exercise regularly less than 3 months"
        level="beginner"
        isSelected={formData.activityLevel === "beginner"}
        onSelect={() => updateField("activityLevel", "beginner")}
      />
      <ActivityLevelCard
        title="Intermediate"
        description="I've been exercising regularly for 3-12 months"
        level="intermediate"
        isSelected={formData.activityLevel === "intermediate"}
        onSelect={() => updateField("activityLevel", "intermediate")}
      />
      <ActivityLevelCard
        title="Advanced"
        description="I've been exercising regularly for over a year"
        level="advanced"
        isSelected={formData.activityLevel === "advanced"}
        onSelect={() => updateField("activityLevel", "advanced")}
      />

      <View className="mt-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          How many days per week do you usually work out?
        </Text>
        <Text className="text-sm text-gray-600 mb-4">
          Choose the number of workout days you already do consistently
        </Text>
        <View className="gap-3">
          {Array.from({ length: 8 }, (_, index) => {
            const isSelected = formData.currentWorkoutDays === index;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => updateField("currentWorkoutDays", index)}
                className={`w-full px-4 py-3 rounded-lg border-2 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isSelected ? "text-blue-700" : "text-gray-700"
                  }`}
                >
                  {index} day{index === 1 ? "" : "s"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default StepActivityLevel;
