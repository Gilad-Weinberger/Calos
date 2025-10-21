import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../lib/context/AuthContext";
import {
  ExerciseDefinition,
  getActivePlan,
} from "../lib/functions/planFunctions";
import {
  getAllExercises,
  saveCompleteWorkout,
  WorkoutExercise,
} from "../lib/functions/workoutFunctions";
import {
  getExercisePositionInSuperset,
  getNextExerciseInSuperset,
  getSupersetExercises,
  isInSuperset,
} from "../lib/utils/superset";
import { useCountdownTimer, useStopwatch } from "../lib/utils/timer";

const WorkoutSession = () => {
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
  const [startTime] = useState(new Date().toISOString());

  // Static exercise state
  const [isStaticExercise, setIsStaticExercise] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [isHolding, setIsHolding] = useState(false);
  const [holdStartTime, setHoldStartTime] = useState<Date | null>(null);
  const [holdDuration, setHoldDuration] = useState(0);
  const [workoutName, setWorkoutName] = useState("");

  // Stopwatch for workout duration
  const { formattedTime: elapsedTime } = useStopwatch(true);

  // Rest timer
  const {
    timeLeft: restTimeLeft,
    isRunning: isRestTimerRunning,
    start: startRestTimer,
    skip: skipRest,
    formattedTime: restFormattedTime,
  } = useCountdownTimer(60, () => {
    setIsResting(false);
  });

  // Load workout data
  useEffect(() => {
    loadWorkoutData();
  }, []);

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

  const loadWorkoutData = async () => {
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
  };

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const totalSets = currentExercise?.sets || 0;
  const isLastSet = currentSetIndex === totalSets - 1;
  const isLastExercise = currentExerciseIndex === totalExercises - 1;

  // Superset helpers
  const inSuperset = currentExercise ? isInSuperset(currentExercise) : false;
  const supersetInfo = currentExercise
    ? getExercisePositionInSuperset(currentExercise, exercises)
    : null;
  const nextExerciseInSuperset = currentExercise
    ? getNextExerciseInSuperset(currentExercise, exercises)
    : null;
  const supersetExercises = currentExercise
    ? getSupersetExercises(currentExercise, exercises)
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
    setHoldStartTime(new Date());
    setHoldDuration(0);

    // Update hold duration every 100ms
    const holdInterval = setInterval(() => {
      if (holdStartTime) {
        const elapsed = Math.floor(
          (new Date().getTime() - holdStartTime.getTime()) / 1000
        );
        setHoldDuration(elapsed);
      }
    }, 100);

    // Store interval reference for cleanup
    (window as any).holdInterval = holdInterval;
  };

  const handleStaticSetComplete = () => {
    if (!isHolding) return;

    // Clear the hold interval
    if ((window as any).holdInterval) {
      clearInterval((window as any).holdInterval);
    }

    const actualDuration = holdDuration;
    const targetDuration = currentExercise?.duration || 0;

    // Save completed duration
    const newCompletedReps = [...completedReps];
    newCompletedReps[currentExerciseIndex][currentSetIndex] = actualDuration;
    setCompletedReps(newCompletedReps);

    // Reset hold state
    setIsHolding(false);
    setHoldStartTime(null);
    setHoldDuration(0);

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
        moveToNextExercise();
      }
    } else {
      if (inSuperset) {
        // In superset but last exercise in superset - start rest
        setCurrentSetIndex(currentSetIndex + 1);
        setIsResting(true);
      } else {
        // Regular exercise - start rest and move to next set
        setCurrentSetIndex(currentSetIndex + 1);
        setIsResting(true);
      }
    }
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
        setCurrentRepInput(nextExerciseInSuperset.reps.toString());
      }
    } else if (isLastSet) {
      // If last set of exercise (or last in superset), move to next exercise or finish
      if (isLastExercise) {
        handleFinishWorkout();
      } else {
        moveToNextExercise();
      }
    } else {
      // Not in superset or last exercise in superset - start rest and move to next set
      if (inSuperset) {
        // Return to first exercise of superset for next set
        const firstExerciseIndex = exercises.findIndex(
          (ex) => ex.superset_group === currentExercise.superset_group
        );
        if (firstExerciseIndex !== -1) {
          setCurrentExerciseIndex(firstExerciseIndex);
          setCurrentSetIndex(currentSetIndex + 1);
          setCurrentRepInput(exercises[firstExerciseIndex].reps.toString());
        }
      } else {
        // Regular exercise - move to next set
        setCurrentSetIndex(currentSetIndex + 1);
        setCurrentRepInput(currentExercise.reps.toString());
      }
      setIsResting(true);
      startRestTimer(currentExercise.rest_seconds);
    }
  };

  const moveToNextExercise = () => {
    setCurrentExerciseIndex(currentExerciseIndex + 1);
    setCurrentSetIndex(0);
    setCurrentRepInput(
      exercises[currentExerciseIndex + 1]?.reps.toString() || ""
    );
  };

  const handleFinishWorkout = async () => {
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
  };

  const saveWorkout = async () => {
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

      await saveCompleteWorkout(user.user_id, workoutData);

      Alert.alert(
        "Workout Complete!",
        "Great job! Your workout has been saved.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(tabs)/record");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading workout...</Text>
      </SafeAreaView>
    );
  }

  if (isSaving) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Saving workout...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          {/* Exit Button */}
          <TouchableOpacity onPress={handleExit} className="p-2">
            <Ionicons name="close" size={28} color="#ef4444" />
          </TouchableOpacity>

          {/* Stopwatch */}
          <View className="flex-row items-center bg-gray-100 px-4 py-2 rounded-lg">
            <Ionicons name="time" size={20} color="#2563eb" />
            <Text className="text-lg font-bold text-gray-900 ml-2">
              {elapsedTime}
            </Text>
          </View>

          {/* Progress */}
          <View className="bg-blue-100 px-3 py-2 rounded-lg">
            <Text className="text-sm font-semibold text-blue-700">
              {currentExerciseIndex + 1}/{totalExercises}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content */}
          <View className="flex-1 p-6">
            {isResting ? (
              /* Rest Timer Screen */
              <View className="flex-1 items-center justify-center">
                <View className="w-32 h-32 rounded-full bg-blue-100 items-center justify-center mb-6">
                  <Text className="text-5xl font-bold text-blue-600">
                    {restFormattedTime.split(":")[1]}
                  </Text>
                  <Text className="text-sm text-blue-600 mt-1">seconds</Text>
                </View>

                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  Rest Time
                </Text>

                <Text className="text-base text-gray-600 mb-8">
                  Get ready for set {currentSetIndex + 1}
                </Text>

                <TouchableOpacity
                  onPress={skipRest}
                  className="bg-blue-600 rounded-lg px-8 py-4"
                >
                  <Text className="text-white font-semibold text-lg">
                    Skip Rest
                  </Text>
                </TouchableOpacity>
              </View>
            ) : showCountdown ? (
              /* Countdown Screen for Static Exercises */
              <View className="flex-1 items-center justify-center">
                <View className="w-40 h-40 rounded-full bg-blue-100 items-center justify-center mb-8">
                  <Text className="text-8xl font-bold text-blue-600">
                    {countdownValue}
                  </Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  Get Ready!
                </Text>
                <Text className="text-base text-gray-600 text-center">
                  Hold for {currentExercise.duration}s
                </Text>
              </View>
            ) : isHolding ? (
              /* Hold Timer Screen for Static Exercises */
              <View className="flex-1 items-center justify-center">
                <View className="w-40 h-40 rounded-full bg-green-100 items-center justify-center mb-8">
                  <Text className="text-6xl font-bold text-green-600">
                    {holdDuration}
                  </Text>
                  <Text className="text-sm text-green-600 mt-1">seconds</Text>
                </View>

                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  {currentExercise.exercise_name}
                </Text>
                <Text className="text-lg text-gray-700 mb-4">
                  Set {currentSetIndex + 1} of {totalSets}
                </Text>

                <View className="bg-gray-100 rounded-lg p-4 mb-8">
                  <Text className="text-center text-gray-600">
                    Target: {currentExercise.duration}s | Current:{" "}
                    {holdDuration}s
                  </Text>
                  <View className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <View
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min((holdDuration / (currentExercise.duration || 1)) * 100, 100)}%`,
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleStaticSetComplete}
                  className="bg-green-600 rounded-lg py-5 px-8 shadow-lg"
                >
                  <Text className="text-white font-bold text-xl text-center">
                    Complete Set
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Exercise Set Screen */
              <View className="flex-1">
                {/* Exercise Info */}
                <View className="mb-8">
                  {/* Superset Badge */}
                  {inSuperset && (
                    <View className="bg-blue-100 px-3 py-2 rounded-lg mb-3 self-start">
                      <Text className="text-sm font-bold text-blue-700">
                        SUPERSET ({supersetInfo?.index! + 1} of{" "}
                        {supersetInfo?.total})
                      </Text>
                    </View>
                  )}

                  {/* Superset Exercises Overview */}
                  {inSuperset && supersetExercises.length > 0 && (
                    <View className="bg-blue-50 rounded-lg p-3 mb-4 border-l-4 border-blue-500">
                      <Text className="text-xs font-semibold text-blue-600 mb-2">
                        Superset Exercises:
                      </Text>
                      {supersetExercises.map((ex, idx) => (
                        <Text
                          key={idx}
                          className={`text-sm ${
                            ex.exercise_name === currentExercise.exercise_name
                              ? "font-bold text-blue-900"
                              : "text-blue-700"
                          }`}
                        >
                          {idx + 1}. {ex.exercise_name} ({ex.sets}×
                          {ex.duration ? `${ex.duration}s` : ex.reps})
                        </Text>
                      ))}
                      <Text className="text-xs text-blue-600 mt-2 italic">
                        No rest between exercises
                      </Text>
                    </View>
                  )}

                  <Text className="text-sm text-gray-600 mb-2">
                    Exercise {currentExerciseIndex + 1} of {totalExercises}
                  </Text>
                  <Text className="text-3xl font-bold text-gray-900 mb-4">
                    {currentExercise.exercise_name}
                  </Text>

                  {/* Set Progress */}
                  <View className="flex-row items-center mb-4">
                    {Array.from({ length: totalSets }).map((_, index) => (
                      <View
                        key={index}
                        className={`h-2 flex-1 rounded-full mx-1 ${
                          index < currentSetIndex
                            ? "bg-green-500"
                            : index === currentSetIndex
                              ? "bg-blue-600"
                              : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </View>

                  <Text className="text-lg text-gray-700">
                    Set {currentSetIndex + 1} of {totalSets}
                  </Text>
                </View>

                {isStaticExercise ? (
                  /* Static Exercise UI */
                  <View className="mb-8">
                    <Text className="text-base text-gray-700 mb-3">
                      Hold for {currentExercise.duration} seconds
                    </Text>

                    <View className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                      <Text className="text-6xl font-bold text-center text-gray-900">
                        {currentExercise.duration}
                      </Text>
                      <Text className="text-center text-gray-600 mt-2">
                        seconds
                      </Text>
                    </View>
                  </View>
                ) : (
                  /* Dynamic Exercise UI */
                  <View className="mb-8">
                    <Text className="text-base text-gray-700 mb-3">
                      How many reps did you complete?
                    </Text>

                    <View className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                      <TextInput
                        value={currentRepInput}
                        onChangeText={setCurrentRepInput}
                        keyboardType="numeric"
                        placeholder={currentExercise.reps?.toString() || "0"}
                        className="text-6xl font-bold text-center text-gray-900"
                        maxLength={3}
                        autoFocus
                      />
                      <Text className="text-center text-gray-600 mt-2">
                        reps (target: {currentExercise.reps})
                      </Text>
                    </View>
                  </View>
                )}

                {/* Done Button */}
                <TouchableOpacity
                  onPress={handleSetComplete}
                  className="bg-blue-600 rounded-lg py-5 px-6 shadow-lg"
                >
                  <Text className="text-white font-bold text-xl text-center">
                    {isStaticExercise
                      ? "Start Hold"
                      : isLastSet && isLastExercise
                        ? "Finish Workout"
                        : inSuperset && nextExerciseInSuperset
                          ? "Next Exercise (No Rest)"
                          : isLastSet
                            ? "Next Exercise"
                            : "Done - Rest"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WorkoutSession;
