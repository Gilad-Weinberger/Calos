import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Maps = () => {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold text-gray-800 mb-2">Maps</Text>
      <Text className="text-base text-gray-600">
        Explore routes and locations
      </Text>
    </SafeAreaView>
  );
};

export default Maps;
