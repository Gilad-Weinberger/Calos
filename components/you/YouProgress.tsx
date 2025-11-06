import React from "react";
import { Text, View } from "react-native";

const YouProgress: React.FC = () => {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-lg font-semibold text-gray-800 mb-2">
          Progress Overview
        </Text>
        <Text className="text-base text-gray-600 text-center">
          Coming soon
        </Text>
      </View>
    </View>
  );
};

export default YouProgress;

