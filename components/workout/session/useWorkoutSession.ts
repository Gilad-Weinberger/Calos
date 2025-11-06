import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  ExerciseDefinition,
  getActivePlan,
} from "../../../lib/functions/planFunctions";
import {
  getAllExercises,
  saveCompleteWorkout,
  WorkoutExercise,
} from "../../../lib/functions/workoutFunctions";
import {
  getExercisePositionInSuperset,
  getNextExerciseInSuperset,
  getSupersetExercises,
  isInSuperset,
} from "../../../lib/utils/superset";
import { useCountdown, useStopwatch } from "../../../lib/utils/timer";

export const useWorkoutSession = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { planId, workoutLetter } = useLocalSearchParams<{
    planId: string;
    workoutLetter: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [completedReps, setCompletedReps] = useState<number[][]>([]);
  const [currentRepInput, setCurrentRepInput] = useState("");
  const [isResting, setIsResting] = useState(false);
  const [showReadyPrompt, setShowReadyPrompt] = useState(false);
  const [startTime] = useState(new Date().toISOString());

  // Static exercise state
  const [isStaticExercise, setIsStaticExercise] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [isHolding, setIsHolding] = useState(false);
  const [holdDuration, setHoldDuration] = useState(0);

  // Manual duration input modal state
  const [showManualDurationInput, setShowManualDurationInput] = useState(false);
  const [manualDurationInput, setManualDurationInput] = useState("");
  const [previousSetInfo, setPreviousSetInfo] = useState<{
    exerciseIndex: number;
    setIndex: number;
  } | null>(null);
  const [workoutName, setWorkoutName] = useState("");

  // Stopwatch for workout duration
  const { formattedTime: elapsedTime } = useStopwatch(true);

  // Rest time tracking
  const [restDuration, setRestDuration] = useState(0);

  const loadWorkoutData = useCallback(async () => {
    try {
      if (!user || !planId) {
        router.back();
        return;
      }

      const plan = await getActivePlan(user.user_id);
      if (!plan || plan.plan_id !== planId) {
        Alert.alert("Error", "Workout plan not found");
        router.back();
        return;
      }

      const workout = plan.workouts[workoutLetter];
      if (!workout) {
        Alert.alert("Error", "Workout not found in plan");
        router.back();
        return;
      }

      setWorkoutName(workout.name);
      setExercises(workout.exercises);

      // Initialize completed reps array - handle both static and dynamic exercises
      const repsArray = workout.exercises.map((ex) => {
        if (ex.duration) {
          // Static exercise: initialize with duration values
          return Array(ex.sets).fill(ex.duration);
        } else {
          // Dynamic exercise: initialize with rep values
          return Array(ex.sets).fill(ex.reps || 0);
        }
      });
      setCompletedReps(repsArray);

      // Set initial rep input based on exercise type
      const firstExercise = workout.exercises[0];
      if (firstExercise?.duration) {
        setCurrentRepInput(firstExercise.duration.toString());
        setIsStaticExercise(true);
      } else {
        setCurrentRepInput((firstExercise?.reps || 0).toString());
        setIsStaticExercise(false);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading workout:", error);
      Alert.alert("Error", "Failed to load workout");
      router.back();
    }
  }, [user, planId, router, workoutLetter]);

  // Load workout data
  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]);

  // Update static exercise state when current exercise changes
  useEffect(() => {
    if (exercises.length > 0 && currentExerciseIndex < exercises.length) {
      const currentExercise = exercises[currentExerciseIndex];
      const isStatic = !!currentExercise.duration;
      setIsStaticExercise(isStatic);

      if (isStatic) {
        setCurrentRepInput(currentExercise.duration?.toString() || "0");
      } else {
        setCurrentRepInput(currentExercise.reps?.toString() || "0");
      }
    }
  }, [currentExerciseIndex, exercises]);

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const totalSets = currentExercise?.sets || 0;
  const isLastSet = currentSetIndex === totalSets - 1;
  const isLastExercise = currentExerciseIndex === totalExercises - 1;

  const handleStaticSetComplete = (isNaturalCompletion: boolean = false) => {
    if (!isHolding) return;

    const targetDuration = currentExercise?.duration || 30;

    if (isNaturalCompletion) {
      // Timer completed naturally - use target duration
      const newCompletedReps = [...completedReps];
      newCompletedReps[currentExerciseIndex][currentSetIndex] = targetDuration;
      setCompletedReps(newCompletedReps);

      // Reset hold state
      setIsHolding(false);
      setHoldDuration(0);

      // Continue to next set or exercise
      proceedToNextSetOrExercise();
    } else {
      // Manual completion - first move to next set, then show modal
      // Store current set info before moving
      setPreviousSetInfo({
        exerciseIndex: currentExerciseIndex,
        setIndex: currentSetIndex,
      });

      // Reset hold state
      setIsHolding(false);
      setHoldDuration(0);

      // Move to next set or exercise first
      proceedToNextSetOrExercise();

      // Then show input modal for the previous set
      setTimeout(() => {
        setManualDurationInput(targetDuration.toString());
        setShowManualDurationInput(true);
      }, 100); // Small delay to ensure state updates are complete
    }
  };

  const proceedToNextSetOrExercise = () => {
    // Move to next set or exercise (same logic as dynamic exercises)
    if (inSuperset && nextExerciseInSuperset) {
      const nextExerciseIndex = exercises.findIndex(
        (ex) => ex.exercise_name === nextExerciseInSuperset.exercise_name
      );
      if (nextExerciseIndex !== -1) {
        setCurrentExerciseIndex(nextExerciseIndex);
        setCurrentRepInput(
          (
            nextExerciseInSuperset.duration ||
            nextExerciseInSuperset.reps ||
            0
          ).toString()
        );
      }
    } else if (isLastSet) {
      if (isLastExercise) {
        handleFinishWorkout();
      } else {
        // Start rest after last set
        setIsResting(true);
        setRestDuration(currentExercise.rest_seconds);
        resetRestTimer(currentExercise.rest_seconds);
        startRestTimer();
      }
    } else {
      if (inSuperset) {
        // In superset but last exercise in superset - start rest
        setCurrentSetIndex(currentSetIndex + 1);
        setIsResting(true);
        setRestDuration(currentExercise.rest_seconds);
        resetRestTimer(currentExercise.rest_seconds);
        startRestTimer();
      } else {
        // Regular exercise - start rest and move to next set
        setCurrentSetIndex(currentSetIndex + 1);
        setIsResting(true);
        setRestDuration(currentExercise.rest_seconds);
        resetRestTimer(currentExercise.rest_seconds);
        startRestTimer();
      }
    }
  };

  // Superset helpers - type-safe wrappers
  const inSuperset = currentExercise ? isInSuperset(currentExercise) : false;
  const supersetInfo = currentExercise
    ? getExercisePositionInSuperset(currentExercise, exercises)
    : null;

  // Type-safe wrapper functions that ensure ExerciseDefinition types
  const getNextExerciseInSupersetTyped = (
    exercise: ExerciseDefinition,
    allExercises: ExerciseDefinition[]
  ): ExerciseDefinition | null => {
    const result = getNextExerciseInSuperset(exercise, allExercises);
    return result as ExerciseDefinition | null;
  };

  const getSupersetExercisesTyped = (
    exercise: ExerciseDefinition,
    allExercises: ExerciseDefinition[]
  ): ExerciseDefinition[] => {
    const result = getSupersetExercises(exercise, allExercises);
    return result as ExerciseDefinition[];
  };

  const nextExerciseInSuperset = currentExercise
    ? getNextExerciseInSupersetTyped(currentExercise, exercises)
    : null;
  const supersetExercises = currentExercise
    ? getSupersetExercisesTyped(currentExercise, exercises)
    : [];

  // Static exercise functions
  const handleStaticExerciseStart = () => {
    setShowCountdown(true);
    setCountdownValue(3);

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
          startHold();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startHold = () => {
    setIsHolding(true);
    const targetDuration = currentExercise?.duration || 30;
    setHoldDuration(targetDuration);
    resetHoldTimer(targetDuration);
    startHoldTimer();
  };

  const handleSetComplete = () => {
    // Handle static exercises differently
    if (isStaticExercise) {
      handleStaticExerciseStart();
      return;
    }

    const reps = parseInt(currentRepInput) || 0;

    if (reps < 1) {
      Alert.alert("Invalid Reps", "Please enter at least 1 rep");
      return;
    }

    // Save completed reps
    const newCompletedReps = [...completedReps];
    newCompletedReps[currentExerciseIndex][currentSetIndex] = reps;
    setCompletedReps(newCompletedReps);

    // Check if in superset
    if (inSuperset && nextExerciseInSuperset) {
      // Move to next exercise in superset WITHOUT rest
      const nextExerciseIndex = exercises.findIndex(
        (ex) => ex.exercise_name === nextExerciseInSuperset.exercise_name
      );
      if (nextExerciseIndex !== -1) {
        setCurrentExerciseIndex(nextExerciseIndex);
        setCurrentRepInput((nextExerciseInSuperset.reps || 0).toString());
      }
    } else if (isLastSet) {
      // Check if this is the last exercise - finish immediately without rest
      if (isLastExercise) {
        handleFinishWorkout();
      } else {
        // Start rest after last set
        setIsResting(true);
        setRestDuration(currentExercise.rest_seconds);
        resetRestTimer(currentExercise.rest_seconds);
        startRestTimer();
      }
    } else {
      // Not in superset or last exercise in superset - start rest
      // Don't increment set index yet - wait until rest is completed
      setIsResting(true);
      setRestDuration(currentExercise.rest_seconds);
      resetRestTimer(currentExercise.rest_seconds);
      startRestTimer();
    }
  };

  const handleManualDurationSubmit = () => {
    const duration = parseInt(manualDurationInput);

    if (isNaN(duration) || duration <= 0) {
      Alert.alert(
        "Invalid Duration",
        "Please enter a valid duration greater than 0 seconds"
      );
      return;
    }

    // Save completed duration to the previous set using stored info
    if (previousSetInfo) {
      const newCompletedReps = [...completedReps];
      newCompletedReps[previousSetInfo.exerciseIndex][
        previousSetInfo.setIndex
      ] = duration;
      setCompletedReps(newCompletedReps);
      console.log("Updated completedReps:", newCompletedReps);
    } else {
      console.log("No previousSetInfo found!");
    }

    // Close modal and reset state
    setShowManualDurationInput(false);
    setManualDurationInput("");
    setPreviousSetInfo(null);
  };

  const moveToNextExercise = useCallback(() => {
    const nextExerciseIndex = currentExerciseIndex + 1;
    if (nextExerciseIndex >= exercises.length) {
      console.warn("Attempted to move beyond last exercise");
      return;
    }
    setCurrentExerciseIndex(nextExerciseIndex);
    setCurrentSetIndex(0);
    setCurrentRepInput((exercises[nextExerciseIndex]?.reps || 0).toString());
  }, [currentExerciseIndex, exercises]);

  const skipRest = () => {
    setIsResting(false);
    setShowReadyPrompt(false);
    resetRestTimer();

    // If this was rest after the last set, move to next exercise
    if (isLastSet && !isLastExercise) {
      // Check if we're in a superset and this is the last exercise of the superset
      if (inSuperset && supersetInfo?.isLast) {
        // This is the last exercise of a superset - move to next exercise group
        moveToNextExercise();
      } else if (!inSuperset) {
        // Regular exercise - move to next exercise
        moveToNextExercise();
      }
      // If we're in a superset but not the last exercise of the superset,
      // the rest timer should not have been shown in the first place
    } else if (!isLastSet) {
      // Regular rest between sets - move to next set
      if (inSuperset) {
        // Return to first exercise of superset for next set
        const firstExerciseIndex = exercises.findIndex(
          (ex) => ex.superset_group === currentExercise.superset_group
        );
        if (firstExerciseIndex !== -1) {
          setCurrentExerciseIndex(firstExerciseIndex);
          setCurrentSetIndex(currentSetIndex + 1);
          setCurrentRepInput(
            (exercises[firstExerciseIndex]?.reps || 0).toString()
          );
        }
      } else {
        // Regular exercise - move to next set
        setCurrentSetIndex(currentSetIndex + 1);
        setCurrentRepInput((currentExercise.reps || 0).toString());
      }
    }
  };

  const saveWorkout = useCallback(async () => {
    try {
      if (!user) return;

      setIsSaving(true);
      const endTime = new Date().toISOString();

      // Get all exercises with their IDs
      const allExercises = await getAllExercises();

      // Build workout exercises array
      const workoutExercises: WorkoutExercise[] = exercises.map((ex, index) => {
        const exerciseData = allExercises.find(
          (e) => e.name.toLowerCase() === ex.exercise_name.toLowerCase()
        );

        return {
          exercise_id: exerciseData?.exercise_id || "",
          exercise_name: ex.exercise_name,
          exercise_type: exerciseData?.type || "dynamic",
          sets: ex.sets,
          reps: completedReps[index],
          order_index: index + 1,
          superset_group: ex.superset_group,
        };
      });

      // Calculate scheduled date (today at midnight)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const workoutData = {
        title: workoutName,
        exercises: workoutExercises,
        plan_id: planId,
        plan_workout_letter: workoutLetter,
        scheduled_date: today.toISOString(),
        start_time: startTime,
        end_time: endTime,
      };

      const { workout_id } = await saveCompleteWorkout(
        user.user_id,
        workoutData
      );

      // Navigate to edit screen instead of showing success alert
      router.push(`/workout/edit/${workout_id}`);
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    exercises,
    completedReps,
    workoutName,
    planId,
    workoutLetter,
    startTime,
    router,
  ]);

  const handleFinishWorkout = useCallback(async () => {
    Alert.alert(
      "Finish Workout",
      "Are you sure you want to finish this workout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finish",
          onPress: async () => {
            await saveWorkout();
          },
        },
      ]
    );
  }, [saveWorkout]);

  // Handle rest completion with haptic feedback and ready prompt
  const handleRestComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Check if this is the rest after the last set of the last exercise
    if (isLastSet && isLastExercise) {
      // Finish the workout after rest
      setTimeout(() => {
        handleFinishWorkout();
      }, 1000);
    } else if (isLastSet) {
      // This is rest after the last set of a non-final exercise
      setShowReadyPrompt(true);

      // Auto-advance after 3 seconds and move to next exercise
      setTimeout(() => {
        setShowReadyPrompt(false);
        setIsResting(false);
        moveToNextExercise();
      }, 3000);
    } else {
      // Regular rest between sets - move to next set
      setShowReadyPrompt(true);

      // Auto-advance after 3 seconds and move to next set
      setTimeout(() => {
        setShowReadyPrompt(false);
        setIsResting(false);

        // Move to next set
        if (inSuperset) {
          // Return to first exercise of superset for next set
          const firstExerciseIndex = exercises.findIndex(
            (ex) => ex.superset_group === currentExercise.superset_group
          );
          if (firstExerciseIndex !== -1) {
            setCurrentExerciseIndex(firstExerciseIndex);
            setCurrentSetIndex(currentSetIndex + 1);
            setCurrentRepInput(
              (exercises[firstExerciseIndex]?.reps || 0).toString()
            );
          }
        } else {
          // Regular exercise - move to next set
          setCurrentSetIndex(currentSetIndex + 1);
          setCurrentRepInput((currentExercise.reps || 0).toString());
        }
      }, 3000);
    }
  }, [
    isLastSet,
    isLastExercise,
    handleFinishWorkout,
    moveToNextExercise,
    inSuperset,
    exercises,
    currentExercise,
    currentSetIndex,
  ]);

  // Rest countdown timer
  const {
    timeLeft: restTimeLeft,
    isRunning: isRestTimerRunning,
    start: startRestTimer,
    reset: resetRestTimer,
  } = useCountdown(restDuration, handleRestComplete, false);

  // Static exercise countdown timer
  const {
    isRunning: isHoldTimerRunning,
    start: startHoldTimer,
    reset: resetHoldTimer,
  } = useCountdown(holdDuration, () => handleStaticSetComplete(true), false);

  // Haptic feedback for 3-second warning
  useEffect(() => {
    if (isRestTimerRunning && restTimeLeft === 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [isRestTimerRunning, restTimeLeft]);

  const handleExit = () => {
    Alert.alert(
      "Exit Workout?",
      "Are you sure you want to exit? Your progress will not be saved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => {
            router.back();
          },
        },
      ]
    );
  };

  return {
    // State
    isLoading,
    isSaving,
    exercises,
    currentExerciseIndex,
    currentSetIndex,
    completedReps,
    currentRepInput,
    isResting,
    showReadyPrompt,
    isStaticExercise,
    showCountdown,
    countdownValue,
    isHolding,
    isHoldTimerRunning,
    holdDuration,
    showManualDurationInput,
    manualDurationInput,
    workoutName,
    elapsedTime,
    restDuration,
    restTimeLeft,
    isRestTimerRunning,
    currentExercise,
    totalExercises,
    totalSets,
    isLastSet,
    isLastExercise,
    inSuperset,
    supersetInfo,
    nextExerciseInSuperset,
    supersetExercises,

    // Actions
    setCurrentRepInput,
    setManualDurationInput,
    handleSetComplete,
    handleStaticSetComplete,
    handleManualDurationSubmit,
    skipRest,
    handleExit,
  };
};

