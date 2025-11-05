import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { WorkoutExercise } from "../../../lib/functions/workoutFunctions";

interface ExerciseSetInputProps {
  exercise: WorkoutExercise;
  onUpdate: (updatedExercise: WorkoutExercise) => void;
  onRemove: () => void;
}

const ExerciseSetInput: React.FC<ExerciseSetInputProps> = ({
  exercise,
  onUpdate,
  onRemove,
}) => {
  const [sets, setSets] = useState(exercise.sets.toString());
  const [reps, setReps] = useState(exercise.reps.map((r) => r.toString()));
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    // Initialize reps array with the number of sets
    const numSets = parseInt(sets) || 1;
    if (reps.length !== numSets) {
      const newReps = Array(numSets)
        .fill("")
        .map((_, index) => reps[index] || "");
      setReps(newReps);
    }
  }, [sets, reps]);

  const handleSetsChange = (value: string) => {
    const numSets = parseInt(value) || 1;
    if (numSets < 1) return;
    if (numSets > 20) {
      Alert.alert("Too many sets", "Maximum 20 sets allowed");
      return;
    }

    setSets(value);
    const newReps = Array(numSets)
      .fill("")
      .map((_, index) => reps[index] || "");
    setReps(newReps);

    // Update parent component
    onUpdate({
      ...exercise,
      sets: numSets,
      reps: newReps.map((r) => parseInt(r) || 0),
    });
  };

  const handleRepChange = (index: number, value: string) => {
    const numReps = parseInt(value) || 0;
    if (numReps < 0) return;
    if (numReps > 999) {
      Alert.alert("Too many reps", "Maximum 999 reps per set");
      return;
    }

    const newReps = [...reps];
    newReps[index] = value;
    setReps(newReps);

    // Update parent component
    onUpdate({
      ...exercise,
      reps: newReps.map((r) => parseInt(r) || 0),
    });
  };

  const getRepLabel = () => {
    return exercise.exercise_type === "static" ? "seconds" : "reps";
  };

  const getRepPlaceholder = () => {
    return exercise.exercise_type === "static" ? "30" : "10";
  };

  const isFormValid = () => {
    const numSets = parseInt(sets);
    return numSets > 0 && reps.every((r) => parseInt(r) > 0);
  };

  const getSummaryText = () => {
    const numSets = parseInt(sets) || 0;
    const unit = exercise.exercise_type === "static" ? "sec" : "reps";

    if (numSets === 0) {
      return "No sets";
    }

    // Get all non-empty reps
    const validReps = reps.map((r) => parseInt(r) || 0).filter((r) => r > 0);

    if (validReps.length === 0) {
      return `${numSets} sets`;
    }

    // Check if all reps are the same
    const allSame = validReps.every((rep) => rep === validReps[0]);

    if (allSame && validReps.length === numSets) {
      // All sets have the same reps
      return `${numSets} sets × ${validReps[0]} ${unit}`;
    } else {
      // Different reps - show as list
      const repsList = validReps.join(", ");
      return `${numSets} sets: ${repsList} ${unit}`;
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Group reps into rows of 3
  const getRepRows = () => {
    const rows = [];
    for (let i = 0; i < reps.length; i += 3) {
      rows.push(reps.slice(i, i + 3));
    }
    return rows;
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
                  exercise.exercise_type === "static"
                    ? "bg-blue-100"
                    : "bg-green-100"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    exercise.exercise_type === "static"
                      ? "text-blue-800"
                      : "text-green-800"
                  }`}
                >
                  {exercise.exercise_type === "static"
                    ? "Time-based"
                    : "Rep-based"}
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
            className="rounded-xl bg-red-50 min-w-[44px] min-h-[44px] items-center justify-center"
          >
            <Text className="text-red-600 font-bold text-3xl">×</Text>
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
                Complete all fields
              </Text>
            </View>
          )}

          {/* Sets Input */}
          <View className="mb-4 mt-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Number of Sets
            </Text>
            <TextInput
              value={sets}
              onChangeText={handleSetsChange}
              placeholder="3"
              keyboardType="numeric"
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </View>

          {/* Reps Inputs - 3 per row */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {getRepLabel().charAt(0).toUpperCase() + getRepLabel().slice(1)}{" "}
              per Set
            </Text>
            {getRepRows().map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row mb-2" style={{ gap: 8 }}>
                {row.map((rep, colIndex) => {
                  const actualIndex = rowIndex * 3 + colIndex;
                  return (
                    <View
                      key={actualIndex}
                      className="flex-1"
                      style={{ minWidth: 0 }}
                    >
                      <Text className="text-xs text-gray-500 mb-1">
                        Set {actualIndex + 1}
                      </Text>
                      <TextInput
                        value={rep}
                        onChangeText={(value) =>
                          handleRepChange(actualIndex, value)
                        }
                        placeholder={getRepPlaceholder()}
                        keyboardType="numeric"
                        className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-center text-base"
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default ExerciseSetInput;
