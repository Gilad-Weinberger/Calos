import React, { useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { ExerciseDefinition } from "../../lib/functions/planFunctions";
import { useCountdownAudio } from "../../lib/hooks/useCountdownAudio";

interface HoldTimerScreenProps {
  holdDuration: number;
  currentExercise: ExerciseDefinition;
  currentSetIndex: number;
  totalSets: number;
  isTimerRunning: boolean;
  onComplete: () => void;
}

const HoldTimerScreen: React.FC<HoldTimerScreenProps> = ({
  holdDuration,
  currentExercise,
  currentSetIndex,
  totalSets,
  isTimerRunning,
  onComplete,
}) => {
  const { playCountdownAudio, resetAudioFlag } = useCountdownAudio();
  const audioTriggeredRef = useRef(false);
  return (
    <View className="flex-1 items-center justify-center">
      <CountdownCircleTimer
        isPlaying={isTimerRunning}
        duration={currentExercise.duration || 30}
        initialRemainingTime={currentExercise.duration || 30}
        colors="#10b981"
        size={200}
        strokeWidth={12}
        onComplete={() => {
          // Reset audio flag for next timer cycle
          audioTriggeredRef.current = false;
          resetAudioFlag();
          // Auto-complete when timer reaches 0
          onComplete();
          return { shouldRepeat: false, delay: 0 };
        }}
      >
        {({ remainingTime }) => {
          // Play countdown audio when reaching 3 seconds
          if (remainingTime === 4 && !audioTriggeredRef.current) {
            audioTriggeredRef.current = true;
            playCountdownAudio();
          }

          return (
            <View className="items-center">
              <Text className="text-5xl font-bold text-gray-900">
                {remainingTime}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">seconds left</Text>
            </View>
          );
        }}
      </CountdownCircleTimer>

      <Text className="text-2xl font-bold text-gray-900 mb-2 mt-6">
        {currentExercise.exercise_name}
      </Text>
      <Text className="text-lg text-gray-700 mb-4">
        Set {currentSetIndex + 1} of {totalSets}
      </Text>

      <View className="bg-gray-100 rounded-lg p-4 mb-8">
        <Text className="text-center text-gray-600">
          Target: {currentExercise.duration}s | Hold until timer reaches 0
        </Text>
      </View>

      <TouchableOpacity
        onPress={onComplete}
        className="bg-green-600 rounded-lg py-5 px-8 shadow-lg"
      >
        <Text className="text-white font-bold text-xl text-center">
          Complete Set
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HoldTimerScreen;
