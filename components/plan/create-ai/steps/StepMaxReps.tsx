import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useCreatePlanAIForm } from "../CreatePlanAIFormContext";

interface ExerciseBlockProps {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onValuePress: () => void;
}

const ExerciseBlock: React.FC<ExerciseBlockProps> = ({
  name,
  icon,
  value,
  onIncrement,
  onDecrement,
  onValuePress,
}) => {
  return (
    <View className="bg-white rounded-xl p-4 border border-gray-200 flex-1 min-w-[140px]">
      <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-3 self-center">
        <Ionicons name={icon} size={24} color="#2563eb" />
      </View>
      <Text className="text-base font-semibold text-gray-900 mb-2 text-center">
        {name}
      </Text>
      <TouchableOpacity onPress={onValuePress} activeOpacity={0.8}>
        <Text className="text-3xl font-bold text-blue-600 text-center">
          {value}
        </Text>
        <Text className="text-xs text-gray-400 text-center mt-1">
          Tap to edit
        </Text>
      </TouchableOpacity>
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

type ExerciseKey = "pushups" | "pullups" | "dips" | "squats";

const EXERCISES: Array<{
  key: ExerciseKey;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "pushups", name: "Push-ups", icon: "body" },
  { key: "pullups", name: "Pull-ups", icon: "arrow-up" },
  { key: "dips", name: "Dips", icon: "arrow-down-circle" },
  { key: "squats", name: "Squats", icon: "footsteps" },
];

const StepMaxReps: React.FC = () => {
  const { formData, updateField } = useCreatePlanAIForm();
  const [activeExercise, setActiveExercise] = useState<ExerciseKey | null>(null);
  const [modalValue, setModalValue] = useState<string>("0");

  const updateReps = (
    exercise: ExerciseKey,
    delta: number
  ) => {
    const currentValue = formData.maxReps[exercise];
    const newValue = Math.max(0, Math.min(100, currentValue + delta));
    updateField("maxReps", {
      ...formData.maxReps,
      [exercise]: newValue,
    });
  };

  const openValueModal = (exercise: ExerciseKey) => {
    setActiveExercise(exercise);
    setModalValue(formData.maxReps[exercise].toString());
  };

  const closeModal = () => {
    setActiveExercise(null);
    setModalValue("0");
  };

  const handleModalSave = () => {
    if (!activeExercise) return;

    const parsed = parseInt(modalValue, 10);
    const sanitized = Number.isNaN(parsed)
      ? 0
      : Math.max(0, Math.min(100, parsed));

    updateField("maxReps", {
      ...formData.maxReps,
      [activeExercise]: sanitized,
    });

    closeModal();
  };

  const handleInputChange = (text: string) => {
    const sanitized = text.replace(/[^0-9]/g, "");
    setModalValue(sanitized);
  };

  const selectedExercise = activeExercise
    ? EXERCISES.find((exercise) => exercise.key === activeExercise)
    : null;

  return (
    <View className="flex-1">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        What&apos;s your current max?
      </Text>
      <Text className="text-base text-gray-600 mb-6">
        Tell us the maximum number of reps you can do for each exercise
      </Text>

      <View className="flex-row flex-wrap gap-4">
        {EXERCISES.map(({ key, name, icon }) => (
          <ExerciseBlock
            key={key}
            name={name}
            icon={icon}
            value={formData.maxReps[key]}
            onIncrement={() => updateReps(key, 1)}
            onDecrement={() => updateReps(key, -1)}
            onValuePress={() => openValueModal(key)}
          />
        ))}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={activeExercise !== null}
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="w-full bg-white rounded-2xl p-6 shadow-lg">
            <Text className="text-lg font-semibold text-gray-900 text-center mb-2">
              Set max reps
            </Text>
            {selectedExercise && (
              <Text className="text-sm text-gray-600 text-center mb-4">
                {selectedExercise.name}
              </Text>
            )}
            <TextInput
              value={modalValue}
              onChangeText={handleInputChange}
              keyboardType="number-pad"
              maxLength={3}
              className="border border-gray-200 rounded-lg px-4 py-3 text-center text-2xl font-bold text-gray-900"
              placeholder="0"
              placeholderTextColor="#D1D5DB"
            />
            <Text className="text-xs text-gray-500 text-center mt-2">
              Enter a value between 0 and 100 reps.
            </Text>
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={closeModal}
                className="flex-1 border border-gray-200 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-600 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleModalSave}
                className="flex-1 bg-blue-600 rounded-lg py-3 items-center"
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default StepMaxReps;
