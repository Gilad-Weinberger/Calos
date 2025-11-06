import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface PlanUploadInitialStateProps {
  onSelectPDF: () => void;
  isLoading: boolean;
}

const PlanUploadInitialState: React.FC<PlanUploadInitialStateProps> = ({
  onSelectPDF,
  isLoading,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6">
      {/* Icon */}
      <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-6">
        <Ionicons name="document-text" size={48} color="#2563eb" />
      </View>

      {/* Title */}
      <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
        Create Your First Workout Plan
      </Text>

      {/* Description */}
      <Text className="text-base text-gray-600 text-center mb-6 px-4">
        Upload a PDF of your workout plan and let AI analyze it to create your
        personalized training schedule
      </Text>

      {/* Upload Button */}
      {!isLoading && (
        <TouchableOpacity
          onPress={onSelectPDF}
          className="bg-blue-600 rounded-lg px-8 py-4 flex-row items-center"
        >
          <Ionicons name="cloud-upload" size={24} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">
            Upload PDF Plan
          </Text>
        </TouchableOpacity>
      )}

      {/* Help Text */}
      <View className="mt-8 bg-gray-50 rounded-lg p-4">
        <Text className="text-sm text-gray-600 text-center">
          <Text className="font-semibold">Tip:</Text> Your PDF should include
          workout names, exercises, sets, reps, and a weekly schedule for best
          results. Our AI can now detect static exercises (planks, wall sits)
          and unilateral exercises (archer push-ups, one-arm movements)
          automatically!
        </Text>
      </View>
    </View>
  );
};

export default PlanUploadInitialState;


