import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

interface PlanUploadProgressStateProps {
  currentStep: string;
  uploadProgress: number;
}

const PlanUploadProgressState: React.FC<PlanUploadProgressStateProps> = ({
  currentStep,
  uploadProgress,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
        {currentStep}
      </Text>
      {uploadProgress > 0 && (
        <View className="w-full px-4 mt-4">
          <View className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </View>
          <Text className="text-sm text-gray-600 mt-2 text-center">
            {uploadProgress}% Complete
          </Text>
        </View>
      )}
    </View>
  );
};

export default PlanUploadProgressState;

