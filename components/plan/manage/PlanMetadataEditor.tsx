import React from "react";
import { Text, TextInput, View } from "react-native";
import type { Plan } from "../../../lib/functions/planFunctions";

interface PlanMetadataEditorProps {
  plan: Plan;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
}

const PlanMetadataEditor: React.FC<PlanMetadataEditorProps> = ({
  plan,
  onNameChange,
  onDescriptionChange,
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View
      className="bg-white rounded-xl p-6 mb-6 border border-gray-200"
      style={{
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Text className="text-lg font-semibold text-gray-900 mb-4">
        Plan Details
      </Text>

      {/* Plan Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Plan Name *
        </Text>
        <TextInput
          value={plan.name}
          onChangeText={onNameChange}
          placeholder="Enter plan name"
          className="bg-gray-50 rounded-lg px-4 py-3 text-base text-gray-900 border border-gray-200"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Description
        </Text>
        <TextInput
          value={plan.description || ""}
          onChangeText={onDescriptionChange}
          placeholder="Enter plan description (optional)"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="bg-gray-50 rounded-lg px-4 py-3 text-base text-gray-900 border border-gray-200 min-h-[100px]"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Read-only fields */}
      <View className="pt-4 border-t border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-medium text-gray-700">Plan Type</Text>
          <View
            className={`px-3 py-1 rounded-full ${
              plan.plan_type === "repeat"
                ? "bg-blue-100"
                : "bg-purple-100"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                plan.plan_type === "repeat"
                  ? "text-blue-800"
                  : "text-purple-800"
              }`}
            >
              {plan.plan_type === "repeat" ? "Repeat" : "Once"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-medium text-gray-700">Duration</Text>
          <Text className="text-sm text-gray-900">
            {plan.num_weeks} {plan.num_weeks === 1 ? "week" : "weeks"}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-gray-700">Start Date</Text>
          <Text className="text-sm text-gray-900">
            {formatDate(plan.start_date)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PlanMetadataEditor;

