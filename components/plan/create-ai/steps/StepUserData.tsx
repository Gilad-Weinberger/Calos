import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

const StepUserData: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        Tell us about yourself
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        This helps us create a personalized plan for you
      </Text>

      {/* Age Input */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Age</Text>
        <TextInput
          className="bg-white rounded-lg p-4 border border-gray-200 text-gray-900 text-lg"
          placeholder="Enter your age"
          placeholderTextColor="#9CA3AF"
          value={formData.age?.toString() || ""}
          onChangeText={(text) => {
            const num = parseInt(text, 10);
            updateField("age", isNaN(num) ? null : num);
          }}
          keyboardType="number-pad"
        />
      </View>

      {/* Height Input with Unit Toggle */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-700 mb-2">Height</Text>
        <View className="flex-row gap-2 mb-2">
          <TouchableOpacity
            onPress={() => updateField("heightUnit", "cm")}
            className={`flex-1 py-3 rounded-lg ${
              formData.heightUnit === "cm" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                formData.heightUnit === "cm" ? "text-white" : "text-gray-700"
              }`}
            >
              cm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateField("heightUnit", "ft")}
            className={`flex-1 py-3 rounded-lg ${
              formData.heightUnit === "ft" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                formData.heightUnit === "ft" ? "text-white" : "text-gray-700"
              }`}
            >
              ft
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          className="bg-white rounded-lg p-4 border border-gray-200 text-gray-900 text-lg"
          placeholder={`Enter your height (${formData.heightUnit})`}
          placeholderTextColor="#9CA3AF"
          value={formData.height?.toString() || ""}
          onChangeText={(text) => {
            const num = parseFloat(text);
            updateField("height", isNaN(num) ? null : num);
          }}
          keyboardType="decimal-pad"
        />
        {formData.heightUnit === "ft" && (
          <Text className="text-xs text-gray-500 mt-2">
            Tip: Use decimal format (e.g., 5.9 for 5&apos;11&quot;)
          </Text>
        )}
      </View>

      {/* Weight Input with Unit Toggle */}
      <View>
        <Text className="text-sm font-semibold text-gray-700 mb-2">Weight</Text>
        <View className="flex-row gap-2 mb-2">
          <TouchableOpacity
            onPress={() => updateField("weightUnit", "kg")}
            className={`flex-1 py-3 rounded-lg ${
              formData.weightUnit === "kg" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                formData.weightUnit === "kg" ? "text-white" : "text-gray-700"
              }`}
            >
              kg
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateField("weightUnit", "lbs")}
            className={`flex-1 py-3 rounded-lg ${
              formData.weightUnit === "lbs" ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                formData.weightUnit === "lbs" ? "text-white" : "text-gray-700"
              }`}
            >
              lbs
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          className="bg-white rounded-lg p-4 border border-gray-200 text-gray-900 text-lg"
          placeholder={`Enter your weight (${formData.weightUnit})`}
          placeholderTextColor="#9CA3AF"
          value={formData.weight?.toString() || ""}
          onChangeText={(text) => {
            const num = parseFloat(text);
            updateField("weight", isNaN(num) ? null : num);
          }}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );
};

export default StepUserData;
