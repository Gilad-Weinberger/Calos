import React, { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ExerciseDefinition } from "../../lib/functions/planFunctions";

interface EditablePlanExerciseItemProps {
  exercise: ExerciseDefinition;
  exerciseType: "static" | "dynamic";
  onUpdate: (updatedExercise: ExerciseDefinition) => void;
  onRemove: () => void;
}

const EditablePlanExerciseItem: React.FC<EditablePlanExerciseItemProps> = ({
  exercise,
  exerciseType,
  onUpdate,
  onRemove,
}) => {
  const [sets, setSets] = useState(exercise.sets.toString());
  const [reps, setReps] = useState<string>(
    exercise.reps ? exercise.reps.toString() : ""
  );
  const [duration, setDuration] = useState<string>(
    exercise.duration ? exercise.duration.toString() : ""
  );
  const [restSeconds, setRestSeconds] = useState(
    exercise.rest_seconds.toString()
  );
  const [supersetGroup, setSupersetGroup] = useState(
    exercise.superset_group || ""
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSetsChange = (value: string) => {
    const numSets = parseInt(value) || 1;
    if (numSets < 1) return;
    if (numSets > 20) {
      Alert.alert("Too many sets", "Maximum 20 sets allowed");
      return;
    }

    setSets(value);
    onUpdate({
      ...exercise,
      sets: numSets,
    });
  };

  const handleRepsChange = (value: string) => {
    const numReps = parseInt(value) || 0;
    if (numReps < 0) return;
    if (numReps > 999) {
      Alert.alert("Too many reps", "Maximum 999 reps allowed");
      return;
    }

    setReps(value);
    onUpdate({
      ...exercise,
      reps: numReps,
      duration: undefined,
    });
  };

  const handleDurationChange = (value: string) => {
    const numDuration = parseInt(value) || 0;
    if (numDuration < 0) return;
    if (numDuration > 999) {
      Alert.alert("Duration too long", "Maximum 999 seconds allowed");
      return;
    }

    setDuration(value);
    onUpdate({
      ...exercise,
      duration: numDuration,
      reps: undefined,
    });
  };

  const handleRestSecondsChange = (value: string) => {
    const numRest = parseInt(value) || 0;
    if (numRest < 0) return;
    if (numRest > 600) {
      Alert.alert("Rest too long", "Maximum 600 seconds (10 minutes) allowed");
      return;
    }

    setRestSeconds(value);
    onUpdate({
      ...exercise,
      rest_seconds: numRest,
    });
  };

  const handleSupersetGroupChange = (value: string) => {
    setSupersetGroup(value);
    onUpdate({
      ...exercise,
      superset_group: value.trim() || undefined,
    });
  };

  const getPlaceholder = () => {
    return exerciseType === "static" ? "30" : "10";
  };

  const isFormValid = () => {
    const numSets = parseInt(sets) || 0;
    const numDuration = parseInt(duration) || 0;
    const numReps = parseInt(reps) || 0;
    const numRest = parseInt(restSeconds);

    const isVolumeValid =
      exerciseType === "static" ? numDuration > 0 : numReps > 0;
    const isRestValid = !isNaN(numRest) && numRest >= 0;

    return numSets > 0 && isVolumeValid && isRestValid;
  };

  const getSummaryText = () => {
    const numSets = parseInt(sets) || 0;
    if (numSets === 0) return "No sets";

    if (exerciseType === "static") {
      const dur = parseInt(duration) || 0;
      return `${numSets} sets × ${dur} sec`;
    } else {
      const rep = parseInt(reps) || 0;
      return `${numSets} sets × ${rep} reps`;
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="bg-white rounded-lg border border-gray-200 mb-3 overflow-hidden shadow-sm">
      {/* Exercise Header - Always Visible, Touchable */}
      <TouchableOpacity
        onPress={toggleExpanded}
        activeOpacity={0.7}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-1 flex-row items-center">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {exercise.exercise_name}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className={`px-2 py-1 rounded-full mr-2 ${
                  exerciseType === "static" ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    exerciseType === "static"
                      ? "text-green-800"
                      : "text-blue-800"
                  }`}
                >
                  {exerciseType === "static" ? "Static" : "Dynamic"}
                </Text>
              </View>
              {!isExpanded && (
                <Text className="text-sm text-gray-600">
                  {getSummaryText()}
                </Text>
              )}
              {!isExpanded && !isFormValid() && (
                <Text className="text-red-500 text-xs ml-2">Incomplete</Text>
              )}
            </View>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className="text-gray-500 text-2xl mr-3">
            {isExpanded ? "▲" : "▼"}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="rounded-lg bg-red-50 w-8 h-8 items-center justify-center"
          >
            <Text className="text-red-600 font-bold text-lg">×</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Expanded Content - Conditionally Rendered */}
      {isExpanded && (
        <View className="px-4 pb-4 border-t border-gray-100">
          {/* Validation Message */}
          {!isFormValid() && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 mt-4">
              <Text className="text-red-600 text-sm font-medium">
                Complete all required fields
              </Text>
            </View>
          )}

          {/* First Row: Sets and Reps/Duration */}
          <View className="flex-row gap-x-3 mb-4 mt-4">
            {/* Sets Input */}
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Sets
              </Text>
              <TextInput
                value={sets}
                onChangeText={handleSetsChange}
                placeholder="3"
                keyboardType="numeric"
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>

            {/* Reps or Duration Input */}
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                {exerciseType === "static" ? "Duration (sec)" : "Reps"}
              </Text>
              <TextInput
                value={exerciseType === "static" ? duration : reps}
                onChangeText={
                  exerciseType === "static"
                    ? handleDurationChange
                    : handleRepsChange
                }
                placeholder={getPlaceholder()}
                keyboardType="numeric"
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
          </View>

          {/* Second Row: Rest and Superset Group */}
          <View className="flex-row gap-x-3 mb-4">
            {/* Rest Seconds Input */}
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Rest (sec)
              </Text>
              <TextInput
                value={restSeconds}
                onChangeText={handleRestSecondsChange}
                placeholder="60"
                keyboardType="numeric"
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>

            {/* Superset Group (Optional) - Only show if it has a value */}
            {supersetGroup && (
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Superset
                </Text>
                <TextInput
                  value={supersetGroup}
                  onChangeText={handleSupersetGroupChange}
                  placeholder="e.g., A, B"
                  className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
                  maxLength={10}
                />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

export default EditablePlanExerciseItem;
