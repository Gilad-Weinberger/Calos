import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const StepPlanTarget: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();

  const handleSelectTarget = (target: "calisthenics" | "specific_exercise") => {
    updateField("planTarget", target);
    if (target === "calisthenics") {
      updateField("specificExercise", "");
    }
  };

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        What&apos;s your goal?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        Choose what you want to achieve with this workout plan
      </Text>

      <View className="gap-4">
        {/* Start Calisthenics Option */}
        <TouchableOpacity
          onPress={() => handleSelectTarget("calisthenics")}
          className={`w-full bg-white rounded-xl px-4 py-4 border-2 ${
            formData.planTarget === "calisthenics"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
          }`}
        >
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
              <Ionicons name="fitness" size={28} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 mb-1">
                Start Calisthenics
              </Text>
              <Text className="text-sm text-gray-600">
                Begin your calisthenics journey
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Learn Specific Exercise Option */}
        <TouchableOpacity
          onPress={() => handleSelectTarget("specific_exercise")}
          className={`w-full bg-white rounded-xl px-4 py-4 border-2 ${
            formData.planTarget === "specific_exercise"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
          }`}
        >
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
              <Ionicons name="star" size={28} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 mb-1">
                Learn Specific Exercise
              </Text>
              <Text className="text-sm text-gray-600">
                Master a particular movement
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Specific Exercise Input */}
      {formData.planTarget === "specific_exercise" && (
        <View className="mt-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Which exercise do you want to learn?
          </Text>
          <TextInput
            className="bg-white rounded-lg p-4 border border-gray-200 text-gray-900"
            placeholder="e.g., Handstand, Muscle-up, Planche"
            placeholderTextColor="#9CA3AF"
            value={formData.specificExercise}
            onChangeText={(text) => updateField("specificExercise", text)}
            autoCapitalize="words"
          />
        </View>
      )}
    </View>
  );
};

export default StepPlanTarget;
