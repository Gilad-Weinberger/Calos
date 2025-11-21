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
        description="I exercise 0-1 times per week regularly"
        level="beginner"
        isSelected={formData.activityLevel === "beginner"}
        onSelect={() => {
          updateField("activityLevel", "beginner");
          updateField("currentWorkoutDays", 1);
        }}
      />
      <ActivityLevelCard
        title="Intermediate"
        description="I exercise 2-3 times per week regularly"
        level="intermediate"
        isSelected={formData.activityLevel === "intermediate"}
        onSelect={() => {
          updateField("activityLevel", "intermediate");
          updateField("currentWorkoutDays", 3);
        }}
      />
      <ActivityLevelCard
        title="Advanced"
        description="I exercise 4+ times per week regularly"
        level="advanced"
        isSelected={formData.activityLevel === "advanced"}
        onSelect={() => {
          updateField("activityLevel", "advanced");
          updateField("currentWorkoutDays", 5);
        }}
      />
    </View>
  );
};

export default StepActivityLevel;
