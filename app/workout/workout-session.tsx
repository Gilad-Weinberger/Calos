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
import WorkoutCountdownScreen from "../../components/workout/session/WorkoutCountdownScreen";
import WorkoutExerciseSetScreen from "../../components/workout/session/WorkoutExerciseSetScreen";
import WorkoutHoldTimerScreen from "../../components/workout/session/WorkoutHoldTimerScreen";
import WorkoutManualDurationInputModal from "../../components/workout/session/WorkoutManualDurationInputModal";
import WorkoutReadyPromptScreen from "../../components/workout/session/WorkoutReadyPromptScreen";
import WorkoutRestTimerScreen from "../../components/workout/session/WorkoutRestTimerScreen";
import { useWorkoutSession } from "../../components/workout/session/useWorkoutSession";
import WorkoutSessionHeader from "../../components/workout/session/WorkoutSessionHeader";

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
    showManualDurationInput,
    manualDurationInput,
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
    setManualDurationInput,
    handleSetComplete,
    handleStaticSetComplete,
    handleManualDurationSubmit,
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
              <WorkoutRestTimerScreen
                restDuration={restDuration}
                restTimeLeft={restTimeLeft}
                isRestTimerRunning={isRestTimerRunning}
                currentSetIndex={currentSetIndex}
                onSkipRest={skipRest}
              />
            ) : showReadyPrompt ? (
              <WorkoutReadyPromptScreen
                currentSetIndex={currentSetIndex}
                onStartSet={skipRest}
              />
            ) : showCountdown ? (
              <WorkoutCountdownScreen
                countdownValue={countdownValue}
                duration={currentExercise?.duration || 0}
              />
            ) : isHolding ? (
              <WorkoutHoldTimerScreen
                holdDuration={holdDuration}
                currentExercise={currentExercise!}
                currentSetIndex={currentSetIndex}
                totalSets={totalSets}
                isTimerRunning={isHoldTimerRunning}
                onComplete={handleStaticSetComplete}
              />
            ) : (
              <WorkoutExerciseSetScreen
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

      {/* Manual Duration Input Modal */}
      {currentExercise && (
        <WorkoutManualDurationInputModal
          visible={showManualDurationInput}
          onSubmit={handleManualDurationSubmit}
          currentExercise={currentExercise}
          currentSetIndex={currentSetIndex}
          totalSets={totalSets}
          manualDurationInput={manualDurationInput}
          onInputChange={setManualDurationInput}
        />
      )}
    </SafeAreaView>
  );
};

export default WorkoutSession;
