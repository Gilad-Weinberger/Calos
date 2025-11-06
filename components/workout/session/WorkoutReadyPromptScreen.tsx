import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface WorkoutReadyPromptScreenProps {
  currentSetIndex: number;
  onStartSet: () => void;
}

const WorkoutReadyPromptScreen: React.FC<WorkoutReadyPromptScreenProps> = ({
  currentSetIndex,
  onStartSet,
}) => {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="w-48 h-48 rounded-full bg-green-100 items-center justify-center mb-8">
        <Text className="text-6xl font-bold text-green-600 animate-pulse">
          Ready?
        </Text>
      </View>

      <Text className="text-2xl font-bold text-gray-900 mb-2">
        Time&apos;s Up!
      </Text>

      <Text className="text-base text-gray-600 mb-8">
        Get ready for set {currentSetIndex + 1}
      </Text>

      <TouchableOpacity
        onPress={onStartSet}
        className="bg-green-600 rounded-lg px-8 py-4"
      >
        <Text className="text-white font-semibold text-lg">
          Start Set
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default WorkoutReadyPromptScreen;


