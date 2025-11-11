import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

interface ExerciseBlockProps {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const ExerciseBlock: React.FC<ExerciseBlockProps> = ({
  name,
  icon,
  value,
  onIncrement,
  onDecrement,
}) => {
  return (
    <View className="bg-white rounded-xl p-4 border border-gray-200 flex-1 min-w-[140px]">
      <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-3 self-center">
        <Ionicons name={icon} size={24} color="#2563eb" />
      </View>
      <Text className="text-base font-semibold text-gray-900 mb-2 text-center">
        {name}
      </Text>
      <Text className="text-3xl font-bold text-blue-600 mb-3 text-center">
        {value}
      </Text>
      <View className="flex-row items-center justify-center gap-3">
        <TouchableOpacity
          onPress={onDecrement}
          disabled={value === 0}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            value === 0 ? "bg-gray-100" : "bg-blue-100"
          }`}
        >
          <Ionicons
            name="remove"
            size={20}
            color={value === 0 ? "#9CA3AF" : "#2563eb"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onIncrement}
          disabled={value >= 100}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            value >= 100 ? "bg-gray-100" : "bg-blue-100"
          }`}
        >
          <Ionicons
            name="add"
            size={20}
            color={value >= 100 ? "#9CA3AF" : "#2563eb"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StepMaxReps: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();

  const updateReps = (
    exercise: "pushups" | "pullups" | "dips" | "squats",
    delta: number
  ) => {
    const currentValue = formData.maxReps[exercise];
    const newValue = Math.max(0, Math.min(100, currentValue + delta));
    updateField("maxReps", {
      ...formData.maxReps,
      [exercise]: newValue,
    });
  };

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        What&apos;s your current max?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        Tell us the maximum number of reps you can do for each exercise
      </Text>

      <View className="flex-row flex-wrap gap-4">
        <ExerciseBlock
          name="Push-ups"
          icon="body"
          value={formData.maxReps.pushups}
          onIncrement={() => updateReps("pushups", 1)}
          onDecrement={() => updateReps("pushups", -1)}
        />
        <ExerciseBlock
          name="Pull-ups"
          icon="arrow-up"
          value={formData.maxReps.pullups}
          onIncrement={() => updateReps("pullups", 1)}
          onDecrement={() => updateReps("pullups", -1)}
        />
        <ExerciseBlock
          name="Dips"
          icon="arrow-down-circle"
          value={formData.maxReps.dips}
          onIncrement={() => updateReps("dips", 1)}
          onDecrement={() => updateReps("dips", -1)}
        />
        <ExerciseBlock
          name="Squats"
          icon="footsteps"
          value={formData.maxReps.squats}
          onIncrement={() => updateReps("squats", 1)}
          onDecrement={() => updateReps("squats", -1)}
        />
      </View>
    </View>
  );
};

export default StepMaxReps;
