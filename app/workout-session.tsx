import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CountdownScreen from "../components/workout-session/CountdownScreen";
import ExerciseSetScreen from "../components/workout-session/ExerciseSetScreen";
import HoldTimerScreen from "../components/workout-session/HoldTimerScreen";
import ReadyPromptScreen from "../components/workout-session/ReadyPromptScreen";
import RestTimerScreen from "../components/workout-session/RestTimerScreen";
import { useWorkoutSession } from "../components/workout-session/useWorkoutSession";
import WorkoutSessionHeader from "../components/workout-session/WorkoutSessionHeader";

const WorkoutSession = () => {
  const {
    // State
    isLoading,
    isSaving,
    currentExerciseIndex,
    totalExercises,
    currentRepInput,
    isResting,
    showReadyPrompt,
    isStaticExercise,
    showCountdown,
    countdownValue,
    isHolding,
    isHoldTimerRunning,
    holdDuration,
    elapsedTime,
    restDuration,
    restTimeLeft,
    isRestTimerRunning,
    currentExercise,
    totalSets,
    currentSetIndex,
    isLastSet,
    isLastExercise,
    inSuperset,
    supersetInfo,
    nextExerciseInSuperset,
    supersetExercises,

    // Actions
    setCurrentRepInput,
    handleSetComplete,
    handleStaticSetComplete,
    skipRest,
    handleExit,
  } = useWorkoutSession();

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
      <WorkoutSessionHeader
        onExit={handleExit}
        elapsedTime={elapsedTime}
        currentExerciseIndex={currentExerciseIndex}
        totalExercises={totalExercises}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 p-6">
            {isResting ? (
              <RestTimerScreen
                restDuration={restDuration}
                restTimeLeft={restTimeLeft}
                isRestTimerRunning={isRestTimerRunning}
                currentSetIndex={currentSetIndex}
                onSkipRest={skipRest}
              />
            ) : showReadyPrompt ? (
              <ReadyPromptScreen
                currentSetIndex={currentSetIndex}
                onStartSet={skipRest}
              />
            ) : showCountdown ? (
              <CountdownScreen
                countdownValue={countdownValue}
                duration={currentExercise?.duration || 0}
              />
            ) : isHolding ? (
              <HoldTimerScreen
                holdDuration={holdDuration}
                currentExercise={currentExercise!}
                currentSetIndex={currentSetIndex}
                totalSets={totalSets}
                isTimerRunning={isHoldTimerRunning}
                onComplete={handleStaticSetComplete}
              />
            ) : (
              <ExerciseSetScreen
                currentExercise={currentExercise!}
                currentExerciseIndex={currentExerciseIndex}
                totalExercises={totalExercises}
                currentSetIndex={currentSetIndex}
                totalSets={totalSets}
                isStaticExercise={isStaticExercise}
                currentRepInput={currentRepInput}
                onRepInputChange={setCurrentRepInput}
                onSetComplete={handleSetComplete}
                inSuperset={inSuperset}
                supersetInfo={supersetInfo}
                supersetExercises={supersetExercises}
                nextExerciseInSuperset={nextExerciseInSuperset}
                isLastSet={isLastSet}
                isLastExercise={isLastExercise}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WorkoutSession;
