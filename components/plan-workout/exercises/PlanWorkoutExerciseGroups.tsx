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

const ExerciseRow: React.FC<{ exercise: PlanWorkoutExercise }> = ({
  exercise,
}) => {
  const detail = useMemo(() => {
    if (exercise.type === "static") {
      if (exercise.duration) {
        const minutes = Math.floor(exercise.duration / 60);
        const seconds = exercise.duration % 60;
        const formattedSeconds = seconds.toString().padStart(2, "0");
        return minutes > 0
          ? `${minutes}m ${formattedSeconds}s`
          : `${formattedSeconds}s`;
      }
      return "Hold";
    }

    const filteredReps = exercise.reps.filter((rep) => typeof rep === "number");
    if (filteredReps.length === 0) {
      return `${exercise.sets} sets`;
    }

    const unique = Array.from(new Set(filteredReps));
    if (unique.length === 1) {
      return `${exercise.sets} x ${unique[0]}`;
    }

    return `${exercise.sets} sets`;
  }, [exercise]);

  const unilateralLabel = useMemo(() => {
    if (!exercise.unilateralType) {
      return null;
    }

    const formatted = exercise.unilateralType.replace(/_/g, " ");
    return exercise.alternating ? `${formatted} · alternating` : formatted;
  }, [exercise.alternating, exercise.unilateralType]);

  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 pr-3">
        <Text className="text-base font-semibold text-gray-900">
          {exercise.name}
        </Text>
        <View className="flex-row items-center mt-1 space-x-3">
          <Text className="text-sm text-gray-500">
            {exercise.type === "static" ? detail : `${exercise.sets} sets`}
          </Text>
          {exercise.type === "dynamic" && (
            <Text className="text-sm text-gray-500">{detail}</Text>
          )}
          {unilateralLabel && (
            <View className="flex-row items-center">
              <Ionicons name="swap-horizontal" size={14} color="#6b7280" />
              <Text className="text-sm text-gray-500 ml-1">
                {unilateralLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
        <Ionicons
          name={exercise.type === "static" ? "stopwatch" : "barbell"}
          size={18}
          color="#111827"
        />
      </View>
    </View>
  );
};

const BlockPill: React.FC<{ block: WorkoutBlock; index: number }> = ({
  block,
  index,
}) => {
  if (block.isSuperset) {
    return (
      <LinearGradient
        colors={["#facc15", "#f97316"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 py-2 rounded-full"
      >
        <Text className="text-sm font-semibold text-black">
          {`Superset ${block.supersetLabel ?? String(index + 1)}`}
        </Text>
      </LinearGradient>
    );
  }

  return (
    <View className="px-4 py-2 rounded-full bg-black">
      <Text className="text-sm font-semibold text-white">
        {`Block ${index + 1}`}
      </Text>
    </View>
  );
};

const BlockCard: React.FC<{
  block: WorkoutBlock;
  index: number;
}> = ({ block, index }) => {
  return (
    <View className="rounded-3xl bg-white shadow-sm p-5">
      <View className="flex-row items-center justify-between mb-4">
        <BlockPill block={block} index={index} />
        <Text className="text-sm text-gray-500">
          {block.exercises.length}{" "}
          {block.exercises.length === 1 ? "exercise" : "exercises"}
        </Text>
      </View>

      <View>
        {block.exercises.map((exercise, idx) => (
          <React.Fragment key={`${block.key}-${exercise.exerciseId}`}>
            <ExerciseRow exercise={exercise} />
            {idx < block.exercises.length - 1 && (
              <View className="h-px bg-gray-100" />
            )}
          </React.Fragment>
        ))}
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
        <BlockCard key={block.key} block={block} index={index} />
      ))}
    </View>
  );
};

export default PlanWorkoutExerciseGroups;
