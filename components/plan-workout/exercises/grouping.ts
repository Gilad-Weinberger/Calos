import { PlanWorkoutExercise } from "../types";

export interface WorkoutBlock {
  key: string;
  order: number;
  isSuperset: boolean;
  supersetLabel?: string;
  exercises: PlanWorkoutExercise[];
}

export const createWorkoutBlocks = (
  exercises: PlanWorkoutExercise[]
): WorkoutBlock[] => {
  if (!exercises || exercises.length === 0) {
    return [];
  }

  const blocks: WorkoutBlock[] = [];
  const supersetMap = new Map<string, WorkoutBlock>();

  const sorted = [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);

  sorted.forEach((exercise, index) => {
    if (exercise.supersetGroup) {
      const existing = supersetMap.get(exercise.supersetGroup);

      if (existing) {
        existing.exercises.push(exercise);
      } else {
        const block: WorkoutBlock = {
          key: `superset-${exercise.supersetGroup}`,
          order: index,
          isSuperset: true,
          supersetLabel: exercise.supersetGroup,
          exercises: [exercise],
        };
        blocks.push(block);
        supersetMap.set(exercise.supersetGroup, block);
      }
    } else {
      blocks.push({
        key: `block-${exercise.exerciseId}-${index}`,
        order: index,
        isSuperset: false,
        exercises: [exercise],
      });
    }
  });

  return blocks.sort((a, b) => a.order - b.order);
};

const formatReps = (exercise: PlanWorkoutExercise): string => {
  if (exercise.type === "static") {
    if (exercise.duration) {
      const minutes = Math.floor(exercise.duration / 60);
      const seconds = exercise.duration % 60;
      const formattedSeconds = seconds.toString().padStart(2, "0");
      return minutes > 0
        ? `${minutes}m ${formattedSeconds}s hold`
        : `${formattedSeconds}s hold`;
    }
    return "Hold until completion";
  }

  const filteredReps = exercise.reps.filter((rep) => typeof rep === "number");
  if (filteredReps.length === 0) {
    return `${exercise.sets} sets`;
  }

  const uniqueReps = Array.from(new Set(filteredReps));
  if (uniqueReps.length === 1) {
    return `${exercise.sets} x ${uniqueReps[0]} reps`;
  }

  const detailed = filteredReps
    .map((rep, idx) => `Set ${idx + 1}: ${rep}`)
    .join(" · ");
  return `${exercise.sets} sets (${detailed})`;
};

const formatUnilateral = (exercise: PlanWorkoutExercise): string | null => {
  if (!exercise.unilateralType) {
    return null;
  }

  if (exercise.alternating) {
    return `${exercise.unilateralType.replace(/_/g, " ")} · alternating`;
  }

  return exercise.unilateralType.replace(/_/g, " ");
};

export const formatBlocksForText = (blocks: WorkoutBlock[]): string => {
  if (!blocks.length) {
    return "No exercises scheduled.";
  }

  const lines: string[] = [];

  blocks.forEach((block, idx) => {
    const title = block.isSuperset
      ? `Block ${idx + 1}: Superset ${block.supersetLabel || ""}`.trim()
      : `Block ${idx + 1}: Set`;
    lines.push(title);

    block.exercises.forEach((exercise) => {
      const detail = formatReps(exercise);
      const unilateral = formatUnilateral(exercise);
      const bullet = `  • ${exercise.name} — ${detail}`;
      lines.push(unilateral ? `${bullet} (${unilateral})` : bullet);
    });
    lines.push("");
  });

  return lines.join("\n").trim();
};

