import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExerciseSelector from "../../workout/create/ExerciseSelector";
import PlanExerciseEditorRow from "./PlanExerciseEditorRow";
import type {
  ExerciseDefinition,
  WorkoutDefinition,
} from "../../../lib/functions/planFunctions";
import { getAllExercises, type Exercise } from "../../../lib/functions/workoutFunctions";

interface PlanWorkoutEditorProps {
  visible: boolean;
  workoutLetter: string | null;
  workout: WorkoutDefinition | null;
  onClose: () => void;
  onSave: (workoutLetter: string, workout: WorkoutDefinition) => void;
}

const PlanWorkoutEditor: React.FC<PlanWorkoutEditorProps> = ({
  visible,
  workoutLetter,
  workout,
  onClose,
  onSave,
}) => {
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedForSuperset, setSelectedForSuperset] = useState<number[]>([]);
  const [nextSupersetId, setNextSupersetId] = useState(1);
  const [exerciseSelectorIndex, setExerciseSelectorIndex] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      loadExercises();
      if (workout) {
        setWorkoutName(workout.name);
        setExercises([...workout.exercises]);
        // Find highest superset group number
        const supersetGroups = workout.exercises
          .map((ex) => ex.superset_group)
          .filter((g): g is string => !!g)
          .map((g) => parseInt(g, 10))
          .filter((n) => !isNaN(n));
        setNextSupersetId(
          supersetGroups.length > 0 ? Math.max(...supersetGroups) + 1 : 1
        );
      } else {
        setWorkoutName("");
        setExercises([]);
        setNextSupersetId(1);
      }
      setSelectedForSuperset([]);
    }
  }, [visible, workout]);

  const loadExercises = async () => {
    try {
      const data = await getAllExercises();
      setAllExercises(data);
    } catch (error) {
      console.error("Error loading exercises:", error);
    }
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    const exerciseDef: ExerciseDefinition = {
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.name,
      sets: 3,
      reps: exercise.type === "dynamic" ? 10 : undefined,
      duration: exercise.type === "static" ? 30 : undefined,
      rest_seconds: 60,
    };
    setExercises([...exercises, exerciseDef]);
  };

  const handleExerciseUpdate = (
    index: number,
    updatedExercise: ExerciseDefinition
  ) => {
    const newExercises = [...exercises];
    newExercises[index] = updatedExercise;
    setExercises(newExercises);
  };

  const handleExerciseRemove = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
    setSelectedForSuperset((prev) => prev.filter((i) => i !== index));
  };

  const handleExerciseNameSelect = (index: number) => {
    setExerciseSelectorIndex(index);
  };

  const handleExerciseChange = (exercise: Exercise) => {
    if (exerciseSelectorIndex === null) return;

    const updatedExercise: ExerciseDefinition = {
      ...exercises[exerciseSelectorIndex],
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.name,
      // Reset reps/duration based on type
      reps: exercise.type === "dynamic" ? 10 : undefined,
      duration: exercise.type === "static" ? 30 : undefined,
    };

    handleExerciseUpdate(exerciseSelectorIndex, updatedExercise);
    setExerciseSelectorIndex(null);
  };

  const toggleExerciseSelection = (index: number) => {
    setSelectedForSuperset((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const createSuperset = () => {
    if (selectedForSuperset.length < 2) {
      Alert.alert(
        "Select Exercises",
        "Please select at least 2 exercises to create a superset"
      );
      return;
    }

    const supersetId = nextSupersetId.toString();
    const newExercises = exercises.map((exercise, index) => {
      if (selectedForSuperset.includes(index)) {
        return { ...exercise, superset_group: supersetId };
      }
      return exercise;
    });

    setExercises(newExercises);
    setSelectedForSuperset([]);
    setNextSupersetId(nextSupersetId + 1);
    Alert.alert("Success", "Superset created!");
  };

  const removeFromSuperset = (index: number) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], superset_group: undefined };
    setExercises(newExercises);
  };

  const handleSave = () => {
    if (!workoutName.trim()) {
      Alert.alert("Error", "Please enter a workout name");
      return;
    }

    if (exercises.length === 0) {
      Alert.alert("Error", "Please add at least one exercise");
      return;
    }

    if (!workoutLetter) {
      Alert.alert("Error", "Workout letter is required");
      return;
    }

    const workoutDef: WorkoutDefinition = {
      name: workoutName,
      exercises: exercises.map((ex, index) => ({
        ...ex,
        // Ensure order is correct
      })),
    };

    onSave(workoutLetter, workoutDef);
  };

  const getExerciseType = (exerciseId: string): "static" | "dynamic" => {
    const exercise = allExercises.find((e) => e.exercise_id === exerciseId);
    return exercise?.type || "dynamic";
  };

  const getSelectedExerciseIds = () => {
    return exercises.map((ex) => ex.exercise_id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-blue-600 font-medium">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">
            {workoutLetter ? `Edit Workout ${workoutLetter}` : "New Workout"}
          </Text>
          <TouchableOpacity onPress={handleSave} className="p-2">
            <Text className="text-blue-600 font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Workout Name */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Workout Name *
            </Text>
            <TextInput
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="Enter workout name"
              className="bg-white rounded-lg px-4 py-3 text-base text-gray-900 border border-gray-300"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Add Exercise */}
          {exerciseSelectorIndex === null && (
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Add Exercise
              </Text>
              <ExerciseSelector
                onExerciseSelect={handleExerciseSelect}
                selectedExerciseIds={getSelectedExerciseIds()}
              />
            </View>
          )}

          {/* Exercise Selector for Editing */}
          {exerciseSelectorIndex !== null && (
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Select Exercise to Replace
              </Text>
              <ExerciseSelector
                onExerciseSelect={handleExerciseChange}
                selectedExerciseIds={exercises
                  .map((ex, i) => (i !== exerciseSelectorIndex ? ex.exercise_id : ""))
                  .filter((id) => id !== "")}
              />
              <TouchableOpacity
                onPress={() => setExerciseSelectorIndex(null)}
                className="mt-2"
              >
                <Text className="text-blue-600 text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Superset Actions */}
          {selectedForSuperset.length > 0 && (
            <View className="mb-4">
              <TouchableOpacity
                onPress={createSuperset}
                className="bg-purple-600 rounded-lg px-4 py-3 flex-row items-center justify-center"
              >
                <Ionicons name="link" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Create Superset ({selectedForSuperset.length} exercises)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Exercises List */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
              Exercises ({exercises.length})
            </Text>
            {exercises.length === 0 ? (
              <View className="bg-white rounded-lg p-6 border border-gray-200">
                <Text className="text-gray-500 text-center">
                  No exercises added yet. Select an exercise above to get started.
                </Text>
              </View>
            ) : (
              exercises.map((exercise, index) => {
                const exerciseType = getExerciseType(exercise.exercise_id);
                const isSelected = selectedForSuperset.includes(index);
                const isInSuperset = !!exercise.superset_group;

                return (
                  <View key={index} className="mb-2">
                    {isSelected && (
                      <View className="bg-blue-100 border-2 border-blue-500 rounded-lg p-2 mb-1">
                        <Text className="text-blue-800 text-xs font-medium text-center">
                          Selected for Superset
                        </Text>
                      </View>
                    )}
                    <PlanExerciseEditorRow
                      exercise={exercise}
                      exerciseName={exercise.exercise_name}
                      exerciseType={exerciseType}
                      onExerciseNamePress={() => handleExerciseNameSelect(index)}
                      onSetsChange={(sets) =>
                        handleExerciseUpdate(index, { ...exercise, sets })
                      }
                      onRepsChange={(reps) =>
                        handleExerciseUpdate(index, { ...exercise, reps })
                      }
                      onDurationChange={(duration) =>
                        handleExerciseUpdate(index, { ...exercise, duration })
                      }
                      onRestSecondsChange={(restSeconds) =>
                        handleExerciseUpdate(index, {
                          ...exercise,
                          rest_seconds: restSeconds,
                        })
                      }
                      onRemove={() => handleExerciseRemove(index)}
                      isInSuperset={isInSuperset}
                      onRemoveFromSuperset={
                        isInSuperset ? () => removeFromSuperset(index) : undefined
                      }
                    />
                    <TouchableOpacity
                      onPress={() => toggleExerciseSelection(index)}
                      className="mt-1 mb-2"
                    >
                      <Text className="text-xs text-blue-600 text-center">
                        {isSelected ? "Deselect" : "Select for Superset"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default PlanWorkoutEditor;

