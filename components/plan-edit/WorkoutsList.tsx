import React, { useState } from "react";
import { Text, View } from "react-native";
import {
  WorkoutDefinition,
  WorkoutDefinitions,
} from "../../lib/functions/planFunctions";
import EditableWorkoutItem from "./EditableWorkoutItem";

interface WorkoutsListProps {
  workouts: WorkoutDefinitions;
  onWorkoutUpdate: (
    workoutLetter: string,
    updatedWorkout: WorkoutDefinition
  ) => void;
}

const WorkoutsList: React.FC<WorkoutsListProps> = ({
  workouts,
  onWorkoutUpdate,
}) => {
  // Track which workout is expanded (only one at a time)
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(
    Object.keys(workouts)[0] || null
  );

  const handleToggleExpand = (workoutLetter: string) => {
    setExpandedWorkout(
      expandedWorkout === workoutLetter ? null : workoutLetter
    );
  };

  const workoutLetters = Object.keys(workouts).sort();

  if (workoutLetters.length === 0) {
    return (
      <View className="bg-red-50 border border-red-200 rounded-lg p-4">
        <Text className="text-red-800 font-semibold mb-1">
          No Workouts Defined
        </Text>
        <Text className="text-red-600 text-sm">
          Your plan must have at least one workout. Please check the PDF
          analysis results.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-3">Workouts</Text>
      {workoutLetters.map((letter) => (
        <EditableWorkoutItem
          key={letter}
          workoutLetter={letter}
          workout={workouts[letter]}
          onUpdate={(updated) => onWorkoutUpdate(letter, updated)}
          isExpanded={expandedWorkout === letter}
          onToggleExpand={() => handleToggleExpand(letter)}
        />
      ))}
    </View>
  );
};

export default WorkoutsList;
