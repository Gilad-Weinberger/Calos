import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Groups = () => {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <View className="flex-row items-center mb-2">
        <Ionicons name="people" size={28} color="#1F2937" />
        <Text className="text-2xl font-bold text-gray-800 ml-2">Groups</Text>
      </View>
      <Text className="text-base text-gray-600 text-center px-4">
        Coming soon
      </Text>
    </SafeAreaView>
  );
};

export default Groups;
