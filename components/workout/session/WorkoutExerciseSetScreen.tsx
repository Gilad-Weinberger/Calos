import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ExerciseDefinition } from "../../../lib/functions/planFunctions";
import WorkoutSetProgressBar from "./WorkoutSetProgressBar";
import DynamicExerciseInput from "./inputs/DynamicExerciseInput";
import StaticExerciseInput from "./inputs/StaticExerciseInput";
import SupersetBadge from "./superset/SupersetBadge";
import SupersetOverview from "./superset/SupersetOverview";

interface WorkoutExerciseSetScreenProps {
  currentExercise: ExerciseDefinition;
  currentExerciseIndex: number;
  totalExercises: number;
  currentSetIndex: number;
  totalSets: number;
  isStaticExercise: boolean;
  currentRepInput: string;
  onRepInputChange: (value: string) => void;
  onSetComplete: () => void;
  inSuperset: boolean;
  supersetInfo: { index: number; total: number } | null;
  supersetExercises: ExerciseDefinition[];
  nextExerciseInSuperset: ExerciseDefinition | null;
  isLastSet: boolean;
  isLastExercise: boolean;
}

const WorkoutExerciseSetScreen: React.FC<WorkoutExerciseSetScreenProps> = ({
  currentExercise,
  currentExerciseIndex,
  totalExercises,
  currentSetIndex,
  totalSets,
  isStaticExercise,
  currentRepInput,
  onRepInputChange,
  onSetComplete,
  inSuperset,
  supersetInfo,
  supersetExercises,
  nextExerciseInSuperset,
  isLastSet,
  isLastExercise,
}) => {
  const getButtonText = () => {
    if (isStaticExercise) {
      return "Start Hold";
    }
    if (isLastSet && isLastExercise) {
      return "Finish Workout";
    }
    if (inSuperset && nextExerciseInSuperset) {
      return "Next Exercise (No Rest)";
    }
    if (isLastSet) {
      return "Next Exercise";
    }
    return "Done - Rest";
  };

  return (
    <View className="flex-1">
      {/* Exercise Info */}
      <View className="mb-8">
        {/* Superset Badge */}
        {inSuperset && supersetInfo && (
          <SupersetBadge
            index={supersetInfo.index}
            total={supersetInfo.total}
          />
        )}

        {/* Superset Exercises Overview */}
        {inSuperset && supersetExercises.length > 0 && (
          <SupersetOverview
            supersetExercises={supersetExercises}
            currentExerciseName={currentExercise.exercise_name}
          />
        )}

        <Text className="text-sm text-gray-600 mb-2">
          Exercise {currentExerciseIndex + 1} of {totalExercises}
        </Text>
        <Text className="text-3xl font-bold text-gray-900 mb-4">
          {currentExercise.exercise_name}
        </Text>

        <WorkoutSetProgressBar
          currentSetIndex={currentSetIndex}
          totalSets={totalSets}
        />
      </View>

      {isStaticExercise ? (
        <StaticExerciseInput currentExercise={currentExercise} />
      ) : (
        <DynamicExerciseInput
          currentExercise={currentExercise}
          currentRepInput={currentRepInput}
          onRepInputChange={onRepInputChange}
        />
      )}

      {/* Done Button */}
      <TouchableOpacity
        onPress={onSetComplete}
        className="bg-blue-600 rounded-lg py-5 px-6 shadow-lg"
      >
        <Text className="text-white font-bold text-xl text-center">
          {getButtonText()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default WorkoutExerciseSetScreen;


