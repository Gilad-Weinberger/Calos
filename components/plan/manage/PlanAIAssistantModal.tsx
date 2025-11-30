import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import type { Plan } from "../../../lib/functions/planFunctions";

type ModalState = "input" | "loading" | "preview";

interface ModifiedPlanData {
  workouts: Plan["workouts"];
  schedule: Plan["schedule"];
  num_weeks: number;
  start_date: string;
}

interface PlanAIAssistantModalProps {
  visible: boolean;
  currentPlan: Plan;
  onClose: () => void;
  onAcceptChanges: (modifiedData: ModifiedPlanData) => void;
}

const PlanAIAssistantModal = ({
  visible,
  currentPlan,
  onClose,
  onAcceptChanges,
}: PlanAIAssistantModalProps) => {
  const [modalState, setModalState] = useState<ModalState>("input");
  const [userPrompt, setUserPrompt] = useState("");
  const [modifiedPlan, setModifiedPlan] = useState<ModifiedPlanData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!userPrompt.trim()) {
      setError("Please enter a modification request");
      return;
    }

    setError(null);
    setModalState("loading");

    try {
      const { supabase } = await import("../../../lib/utils/supabase");
      const { data, error: functionError } = await supabase.functions.invoke(
        "modify-workout-plan",
        {
          body: {
            currentPlan,
            userPrompt: userPrompt.trim(),
            userId: currentPlan.user_id,
          },
        }
      );

      if (functionError) {
        console.error("Error from edge function:", functionError);
        throw new Error(
          functionError.message || "Failed to modify plan. Please try again."
        );
      }

      if (!data) {
        throw new Error("No data returned from AI modification");
      }

      setModifiedPlan(data as ModifiedPlanData);
      setModalState("preview");
    } catch (err: any) {
      console.error("Error modifying plan:", err);
      setError(err.message || "Failed to modify plan. Please try again.");
      setModalState("input");
    }
  };

  const handleAccept = () => {
    if (modifiedPlan) {
      onAcceptChanges(modifiedPlan);
      handleClose();
    }
  };

  const handleEditPrompt = () => {
    setModalState("input");
    setError(null);
  };

  const handleClose = () => {
    setModalState("input");
    setUserPrompt("");
    setModifiedPlan(null);
    setError(null);
    onClose();
  };

  const renderInputState = () => (
    <>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold">AI Plan Assistant</Text>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={28} color="#374151" />
        </TouchableOpacity>
      </View>
      <Text className="text-gray-600 mb-4">
        Describe the changes you&apos;d like to make to your workout plan
      </Text>

      <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <View className="flex-row items-start">
          <Ionicons
            name="information-circle"
            size={20}
            color="#2563eb"
            style={{ marginRight: 8, marginTop: 2 }}
          />
          <Text className="text-blue-800 text-sm flex-1">
            Changes will only affect future workouts. Completed workouts remain
            unchanged.
          </Text>
        </View>
      </View>

      <Text className="text-sm font-semibold text-gray-700 mb-2">
        Your Request
      </Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4 min-h-[120px] bg-white"
        placeholder="e.g., Add more leg exercises to workout A"
        value={userPrompt}
        onChangeText={setUserPrompt}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={{ fontSize: 16 }}
      />

      {error && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <Text className="text-red-800 text-sm">{error}</Text>
        </View>
      )}

      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          onPress={handleClose}
          className="flex-1 bg-gray-200 rounded-lg py-3"
        >
          <Text className="text-gray-800 font-semibold text-center">
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!userPrompt.trim()}
          className={`flex-1 rounded-lg py-3 ${
            userPrompt.trim() ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <Text className="text-white font-semibold text-center">
            Generate Changes
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderLoadingState = () => (
    <>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold">AI Plan Assistant</Text>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={28} color="#374151" />
        </TouchableOpacity>
      </View>
      <View className="items-center justify-center py-16">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4 text-lg">
          AI is analyzing your request...
        </Text>
        <Text className="text-gray-500 mt-2 text-center px-8">
          This may take a few moments while we generate the perfect
          modifications for your plan
        </Text>
      </View>
    </>
  );

  const renderPreviewState = () => {
    if (!modifiedPlan) return null;

    const hasWorkoutsChanged =
      JSON.stringify(currentPlan.workouts) !==
      JSON.stringify(modifiedPlan.workouts);
    const hasScheduleChanged =
      JSON.stringify(currentPlan.schedule) !==
      JSON.stringify(modifiedPlan.schedule);
    const hasNumWeeksChanged = currentPlan.num_weeks !== modifiedPlan.num_weeks;
    const hasStartDateChanged =
      currentPlan.start_date !== modifiedPlan.start_date;

    return (
      <>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold">Preview Changes</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={28} color="#374151" />
          </TouchableOpacity>
        </View>
        <Text className="text-gray-600 mb-4">
          Review the AI-suggested modifications before applying
        </Text>

        <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle"
              size={20}
              color="#2563eb"
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <Text className="text-blue-800 text-sm flex-1">
              Changes will only affect future workouts. Your completed workouts
              remain unchanged.
            </Text>
          </View>
        </View>

        <ScrollView
          className="mb-4"
          style={{ flexGrow: 0, flexShrink: 1 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* Summary of Changes */}
          <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold mb-3">Summary</Text>
            {hasWorkoutsChanged && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700">Workouts modified</Text>
              </View>
            )}
            {hasScheduleChanged && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700">Schedule updated</Text>
              </View>
            )}
            {hasNumWeeksChanged && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700">
                  Duration changed: {currentPlan.num_weeks} →{" "}
                  {modifiedPlan.num_weeks} weeks
                </Text>
              </View>
            )}
            {hasStartDateChanged && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text className="ml-2 text-gray-700">Start date updated</Text>
              </View>
            )}
            {!hasWorkoutsChanged &&
              !hasScheduleChanged &&
              !hasNumWeeksChanged &&
              !hasStartDateChanged && (
                <Text className="text-gray-500 italic">
                  No changes detected
                </Text>
              )}
          </View>

          {/* Detailed Changes */}
          {hasWorkoutsChanged && (
            <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <Text className="text-lg font-semibold mb-3">
                Workout Changes
              </Text>
              {Object.entries(modifiedPlan.workouts).map(
                ([letter, workout]) => {
                  const originalWorkout = currentPlan.workouts[letter];
                  const isNew = !originalWorkout;
                  const isModified =
                    originalWorkout &&
                    JSON.stringify(originalWorkout) !== JSON.stringify(workout);

                  if (!isNew && !isModified) return null;

                  return (
                    <View
                      key={letter}
                      className={`mb-3 p-3 rounded-lg ${
                        isNew ? "bg-green-50" : "bg-yellow-50"
                      }`}
                    >
                      <Text className="font-semibold mb-1">
                        Workout {letter}: {workout.name}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {workout.exercises.length} exercise
                        {workout.exercises.length !== 1 ? "s" : ""}
                      </Text>
                      {isNew && (
                        <Text className="text-xs text-green-700 mt-1">
                          NEW WORKOUT
                        </Text>
                      )}
                      {isModified && (
                        <Text className="text-xs text-yellow-700 mt-1">
                          MODIFIED
                        </Text>
                      )}
                    </View>
                  );
                }
              )}
            </View>
          )}

          {hasScheduleChanged && (
            <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <Text className="text-lg font-semibold mb-3">
                Schedule Changes
              </Text>
              {modifiedPlan.schedule.map((week, weekIndex) => {
                const originalWeek = currentPlan.schedule[weekIndex];
                const hasChanged =
                  !originalWeek ||
                  JSON.stringify(originalWeek) !== JSON.stringify(week);

                if (!hasChanged) return null;

                return (
                  <View key={weekIndex} className="mb-2">
                    <Text className="font-medium mb-1">
                      Week {weekIndex + 1}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {week.join(" → ")}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            onPress={handleEditPrompt}
            className="flex-1 bg-gray-200 rounded-lg py-3"
          >
            <Text className="text-gray-800 font-semibold text-center">
              Edit Prompt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAccept}
            className="flex-1 bg-blue-600 rounded-lg py-3"
          >
            <Text className="text-white font-semibold text-center">
              Accept Changes
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <TouchableWithoutFeedback>
            <View
              className="bg-white rounded-2xl w-[85%] max-h-[80%] p-5"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              {modalState === "input" && renderInputState()}
              {modalState === "loading" && renderLoadingState()}
              {modalState === "preview" && renderPreviewState()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default PlanAIAssistantModal;
