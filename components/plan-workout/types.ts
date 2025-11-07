import { Plan, WorkoutDefinition } from "../../lib/functions/planFunctions";
import { DatabaseWorkout } from "../../lib/functions/workoutFunctions";

export interface PlanWorkoutExercise {
  exerciseId: string;
  name: string;
  type: "static" | "dynamic";
  sets: number;
  reps: number[];
  duration?: number | null;
  restSeconds?: number;
  supersetGroup?: string | null;
  orderIndex: number;
  unilateralType?: string | null;
  alternating?: boolean;
}

export interface PlanWorkoutViewModel {
  workoutId: string;
  planId?: string | null;
  planName?: string | null;
  planWorkoutLetter?: string | null;
  scheduledDate?: Date | null;
  isCompleted: boolean;
  title: string;
  description?: string | null;
  exercises: PlanWorkoutExercise[];
  totalSets: number;
  totalExercises: number;
  totalSupersets: number;
  definition?: WorkoutDefinition | null;
  workoutRecord: DatabaseWorkout;
  plan?: Plan | null;
}

