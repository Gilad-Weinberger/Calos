import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { PlanWorkoutExercise } from "../types";
import { createWorkoutBlocks, WorkoutBlock } from "./grouping";

interface PlanWorkoutExerciseGroupsProps {
  exercises?: PlanWorkoutExercise[];
  blocks?: WorkoutBlock[];
}

const ExerciseRow: React.FC<{
  exercise: PlanWorkoutExercise;
  isInSuperset?: boolean;
  isLastInGroup?: boolean;
}> = ({ exercise, isInSuperset = false, isLastInGroup = false }) => {
  const detail = useMemo(() => {
    if (exercise.type === "static") {
      // For static exercises, use duration field as the source of truth
      const seconds = exercise.duration || 0;
      if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (remainingSeconds === 0) {
          return `${minutes} mins`;
        }
        return `${minutes} min ${remainingSeconds} sec`;
      }
      return `${seconds} sec`;
    } else {
      // Dynamic exercise - show reps
      return `${exercise.reps[0] || 0}`;
    }
  }, [exercise.type, exercise.duration, exercise.reps]);

  // Reduce padding for exercises in supersets
  const paddingClass = isInSuperset
    ? isLastInGroup
      ? "pt-2 pb-2"
      : "py-2"
    : "py-3";

  return (
    <View
      className={`w-full flex-row items-center justify-between ${paddingClass}`}
    >
      <View className="flex-1 pr-3">
        <Text className="text-sm font-medium text-gray-900">
          {detail} {exercise.name}
        </Text>
      </View>
      <Ionicons
        name={exercise.type === "dynamic" ? "flash" : "time"}
        size={16}
        color={exercise.type === "dynamic" ? "#3B82F6" : "#22C55E"}
      />
    </View>
  );
};

const BlockPill: React.FC<{ block: WorkoutBlock }> = ({ block }) => {
  const setsCount = block.exercises[0]?.sets || 0;
  const restSeconds = block.exercises[0]?.restSeconds || 0;

  const formatRestTime = (seconds: number): string => {
    if (seconds === 0) return "";
    if (seconds < 60) return `${seconds}s rest`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes}min rest`;
    }
    return `${minutes}min ${remainingSeconds}s rest`;
  };

  const restText = formatRestTime(restSeconds);
  const restDisplay = restText ? `  ·  ${restText}` : "";

  if (block.isSuperset) {
    return (
      <LinearGradient
        colors={["#9333EA", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 py-1"
        style={{ borderTopRightRadius: 10, borderTopLeftRadius: 10 }}
      >
        <Text className="text-sm font-semibold text-white">
          {`Superset (x${setsCount}${restDisplay})`}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#3B82F6", "#2563EB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="px-4 py-1"
      style={{ borderTopRightRadius: 10, borderTopLeftRadius: 10 }}
    >
      <Text className="text-sm font-semibold text-white">
        {`Exercise (x${setsCount}${restDisplay})`}
      </Text>
    </LinearGradient>
  );
};

const BlockCard: React.FC<{
  block: WorkoutBlock;
  blockNumber: number;
}> = ({ block, blockNumber }) => {
  return (
    <View className="bg-white shadow-sm mb-4" style={{ borderRadius: 10 }}>
      <BlockPill block={block} />

      <View className="px-4 flex flex-row items-center">
        <Text className="text-3xl font-medium text-gray-600 mr-4 py-2">
          {blockNumber}
        </Text>
        <View className="flex-1">
          {block.exercises.map((exercise, idx) => (
            <React.Fragment key={`${block.key}-${exercise.exerciseId}`}>
              <ExerciseRow
                exercise={exercise}
                isInSuperset={block.isSuperset}
                isLastInGroup={idx === block.exercises.length - 1}
              />
              {idx < block.exercises.length - 1 && !block.isSuperset && (
                <View className="h-px bg-gray-100" />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
};

const PlanWorkoutExerciseGroups: React.FC<PlanWorkoutExerciseGroupsProps> = ({
  exercises,
  blocks: providedBlocks,
}) => {
  const blocks = useMemo(() => {
    if (providedBlocks) {
      return providedBlocks;
    }
    return createWorkoutBlocks(exercises || []);
  }, [exercises, providedBlocks]);

  if (blocks.length === 0) {
    return (
      <View className="rounded-3xl bg-white shadow-sm p-5">
        <Text className="text-gray-500">
          Exercises have not been added to this workout yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-4">
      {blocks.map((block, index) => (
        <BlockCard key={block.key} block={block} blockNumber={index + 1} />
      ))}
    </View>
  );
};

export default PlanWorkoutExerciseGroups;
