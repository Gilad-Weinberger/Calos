import React from "react";
import { Text, View } from "react-native";

interface CountdownScreenProps {
  countdownValue: number;
  duration: number;
}

const CountdownScreen: React.FC<CountdownScreenProps> = ({
  countdownValue,
  duration,
}) => {
  return (
    <View className="flex-1 items-center justify-center">
      <View className="w-52 h-52 rounded-full bg-blue-100 items-center justify-center mb-8">
        <Text className="text-7xl font-bold text-blue-600">
          {countdownValue}
        </Text>
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-2">Get Ready!</Text>
      <Text className="text-base text-gray-600 text-center">
        Hold for {duration}s
      </Text>
    </View>
  );
};

export default CountdownScreen;
