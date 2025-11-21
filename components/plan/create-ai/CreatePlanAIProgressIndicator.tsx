import React from "react";
import { View } from "react-native";

interface CreatePlanAIProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const CreatePlanAIProgressIndicator: React.FC<
  CreatePlanAIProgressIndicatorProps
> = ({ currentStep, totalSteps = 7 }) => {
  return (
    <View className="flex-row items-center justify-center px-6 py-4">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isCurrent = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <View
            key={stepNumber}
            className={`rounded-full ${
              isCurrent
                ? "w-8 h-2 bg-blue-600"
                : isCompleted
                  ? "w-2 h-2 bg-blue-300"
                  : "w-2 h-2 bg-gray-300"
            } ${index < totalSteps - 1 ? "mr-2" : ""}`}
          />
        );
      })}
    </View>
  );
};

export default CreatePlanAIProgressIndicator;
