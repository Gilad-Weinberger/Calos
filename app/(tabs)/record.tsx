import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Record = () => {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold text-gray-800 mb-2">
        Record Activity
      </Text>
      <Text className="text-base text-gray-500">
        Start tracking your workout
      </Text>
    </SafeAreaView>
  );
};

export default Record;
