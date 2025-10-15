import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Groups = () => {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold text-gray-800 mb-2">Groups</Text>
      <Text className="text-base text-gray-600">
        Connect with other athletes
      </Text>
    </SafeAreaView>
  );
};

export default Groups;
