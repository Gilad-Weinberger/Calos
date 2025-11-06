import React, { useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { useCountdownAudio } from "../../../lib/hooks/useCountdownAudio";

interface WorkoutRestTimerScreenProps {
  restDuration: number;
  restTimeLeft: number;
  isRestTimerRunning: boolean;
  currentSetIndex: number;
  onSkipRest: () => void;
}

const WorkoutRestTimerScreen: React.FC<WorkoutRestTimerScreenProps> = ({
  restDuration,
  restTimeLeft,
  isRestTimerRunning,
  currentSetIndex,
  onSkipRest,
}) => {
  const { playCountdownAudio, resetAudioFlag } = useCountdownAudio();
  const audioTriggeredRef = useRef(false);
  return (
    <View className="flex-1 items-center justify-center">
      <CountdownCircleTimer
        isPlaying={isRestTimerRunning}
        duration={restDuration}
        initialRemainingTime={restTimeLeft}
        colors="#3b82f6"
        size={200}
        strokeWidth={12}
        onComplete={() => {
          // Reset audio flag for next timer cycle
          audioTriggeredRef.current = false;
          resetAudioFlag();
          // This will be handled by the useCountdown hook
          return { shouldRepeat: false, delay: 0 };
        }}
      >
        {({ remainingTime }) => {
          // Play countdown audio when reaching 3 seconds
          if (remainingTime === 3 && !audioTriggeredRef.current) {
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
        Rest Time
      </Text>

      <Text className="text-base text-gray-600 mb-2">
        Target: {restDuration}s
      </Text>

      <Text className="text-base text-gray-600 mb-8">
        Get ready for set {currentSetIndex + 1}
      </Text>

      <TouchableOpacity
        onPress={onSkipRest}
        className="bg-blue-600 rounded-lg px-8 py-4"
      >
        <Text className="text-white font-semibold text-lg">Skip Rest</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WorkoutRestTimerScreen;


