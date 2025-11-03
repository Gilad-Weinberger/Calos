import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

interface PlanMetadataFormProps {
  name: string;
  description: string;
  planType: "repeat" | "once";
  numWeeks: number;
  startDate: string;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onPlanTypeChange: (type: "repeat" | "once") => void;
  onNumWeeksChange: (weeks: number) => void;
  onStartDateChange: (date: string) => void;
}

const PlanMetadataForm: React.FC<PlanMetadataFormProps> = ({
  name,
  description,
  planType,
  numWeeks,
  startDate,
  onNameChange,
  onDescriptionChange,
  onPlanTypeChange,
  onNumWeeksChange,
}) => {
  const formatStartDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View className="gap-y-4">
      {/* Plan Name */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Plan Name
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={name}
          onChangeText={onNameChange}
          placeholder="Enter plan name"
          maxLength={100}
        />
      </View>

      {/* Description */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Description
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 h-20"
          value={description || ""}
          onChangeText={onDescriptionChange}
          placeholder="Add notes about your plan..."
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
      </View>

      {/* Plan Type */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Plan Type
        </Text>
        <View className="flex-row gap-x-3">
          <TouchableOpacity
            onPress={() => onPlanTypeChange("repeat")}
            className={`flex-1 py-3 px-4 rounded-lg border-2 ${
              planType === "repeat"
                ? "bg-blue-50 border-blue-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                planType === "repeat" ? "text-blue-700" : "text-gray-600"
              }`}
            >
              Repeat
            </Text>
            <Text
              className={`text-xs text-center mt-1 ${
                planType === "repeat" ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Cycles continuously
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onPlanTypeChange("once")}
            className={`flex-1 py-3 px-4 rounded-lg border-2 ${
              planType === "once"
                ? "bg-blue-50 border-blue-500"
                : "bg-white border-gray-300"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                planType === "once" ? "text-blue-700" : "text-gray-600"
              }`}
            >
              Once
            </Text>
            <Text
              className={`text-xs text-center mt-1 ${
                planType === "once" ? "text-blue-600" : "text-gray-500"
              }`}
            >
              Runs one time
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Number of Weeks */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Number of Weeks
        </Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
          value={numWeeks.toString()}
          onChangeText={(value) => {
            const parsed = parseInt(value);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 52) {
              onNumWeeksChange(parsed);
            }
          }}
          placeholder="4"
          keyboardType="numeric"
          maxLength={2}
        />
        <Text className="text-xs text-gray-500 mt-1">
          Plan duration (1-52 weeks)
        </Text>
      </View>

      {/* Start Date (Display Only) */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Start Date
        </Text>
        <View className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3">
          <Text className="text-gray-700 font-medium">
            {formatStartDate(startDate)}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            Plans start on Sunday of the current week
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PlanMetadataForm;

