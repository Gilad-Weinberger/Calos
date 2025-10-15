import React from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold text-gray-800 mb-2">Home</Text>
      <Text className="text-base text-gray-600 mt-4">
        Welcome to your fitness journey
      </Text>
    </SafeAreaView>
  );
};

export default Home;
