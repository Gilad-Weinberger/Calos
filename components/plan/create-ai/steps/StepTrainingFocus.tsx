import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const StepTrainingFocus: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();

  const handleSelectFocus = (focus: "upper" | "lower" | "all") => {
    updateField("trainingFocus", focus);
  };

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        What do you want to train?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        Choose which muscle groups you want to focus on
      </Text>

      <View className="gap-4">
        {/* Upper Body Option */}
        <TouchableOpacity
          onPress={() => handleSelectFocus("upper")}
          className={`w-full bg-white rounded-xl px-4 py-4 border-2 ${
            formData.trainingFocus === "upper"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200"
          }`}
        >
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
              <MaterialCommunityIcons
                name="arm-flex"
                size={30}
                color="#2563eb"
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 mb-1">
                Upper Body
              </Text>
              <Text className="text-sm text-gray-600">
                Push-ups, pull-ups, dips, and core
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Lower Body Option */}
        <TouchableOpacity
          onPress={() => handleSelectFocus("lower")}
          className={`w-full bg-white rounded-xl px-4 py-4 border-2 ${
            formData.trainingFocus === "lower"
              ? "border-green-500 bg-green-50"
              : "border-gray-200"
          }`}
        >
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-green-100 items-center justify-center">
              <MaterialCommunityIcons
                name="shoe-sneaker"
                size={30}
                color="#16a34a"
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 mb-1">
                Lower Body
              </Text>
              <Text className="text-sm text-gray-600">
                Squats, lunges, and leg exercises
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* All Option */}
        <TouchableOpacity
          onPress={() => handleSelectFocus("all")}
          className={`w-full bg-white rounded-xl px-4 py-4 border-2 ${
            formData.trainingFocus === "all"
              ? "border-purple-500 bg-purple-50"
              : "border-gray-200"
          }`}
        >
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 rounded-full bg-purple-100 items-center justify-center">
              <MaterialCommunityIcons
                name="human-handsup"
                size={30}
                color="#9333ea"
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900 mb-1">
                All
              </Text>
              <Text className="text-sm text-gray-600">
                Balanced full-body workouts
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default StepTrainingFocus;

