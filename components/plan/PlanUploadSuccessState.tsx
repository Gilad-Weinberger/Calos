import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PlanUploadSuccessStateProps {
  fileName: string;
  aiNotes: string;
  onAiNotesChange: (notes: string) => void;
  onCancel: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const PlanUploadSuccessState: React.FC<PlanUploadSuccessStateProps> = ({
  fileName,
  aiNotes,
  onAiNotesChange,
  onCancel,
  onAnalyze,
  isAnalyzing,
}) => {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
      <View className="mb-6">
        <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4 self-center">
          <Ionicons name="checkmark-circle" size={32} color="#10b981" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          PDF Uploaded Successfully
        </Text>
        <Text className="text-base text-gray-600 text-center mb-1">
          {fileName}
        </Text>
      </View>

      {/* AI Notes Input */}
      <View className="w-full mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          AI Instructions (Optional)
        </Text>
        <TextInput
          value={aiNotes}
          onChangeText={onAiNotesChange}
          placeholder="e.g., 'Ignore warmup exercises' or 'Focus on compound movements only'"
          multiline
          numberOfLines={4}
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
          textAlignVertical="top"
        />
        <Text className="text-xs text-gray-500 mt-1">
          Add specific instructions for the AI analyzer. These will be taken
          into account when analyzing your PDF.
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onCancel}
          className="flex-1 bg-gray-200 rounded-lg px-6 py-4 items-center"
        >
          <Text className="text-gray-900 font-semibold">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAnalyze}
          className="flex-1 bg-blue-600 rounded-lg px-6 py-4 items-center flex-row justify-center"
          disabled={isAnalyzing}
        >
          <Ionicons name="analytics" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Analyze PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Help Text */}
      <View className="mt-6 bg-gray-50 rounded-lg p-4">
        <Text className="text-sm text-gray-600 text-center">
          <Text className="font-semibold">Tip:</Text> Once you click
          &quot;Analyze PDF&quot;, the AI will process your workout plan using
          your instructions (if provided).
        </Text>
      </View>
    </ScrollView>
  );
};

export default PlanUploadSuccessState;


