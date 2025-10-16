import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const IndexScreen = () => {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-15 pb-10 justify-between">
        {/* Logo/App Name */}
        <View className="items-center mt-10">
          <Text className="text-5xl font-bold text-gray-800 mb-2">Calos</Text>
          <Text className="text-lg text-gray-500 text-center font-medium">
            Your Fitness Journey Starts Here
          </Text>
        </View>

        {/* Hero Image or Icon */}
        <View className="items-center my-10">
          <View className="w-30 h-30 rounded-full bg-gray-100 justify-center items-center shadow-lg">
            <Text className="text-6xl">💪</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-4 mb-10">
          <TouchableOpacity
            className="bg-blue-500 rounded-2xl py-4.5 px-8 items-center shadow-lg shadow-blue-500/30"
            onPress={() => router.push("/auth/signup")}
          >
            <Text className="text-white text-lg font-semibold">Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-transparent rounded-2xl py-4.5 px-8 items-center border-2 border-blue-500"
            onPress={() => router.push("/auth/signin")}
          >
            <Text className="text-blue-500 text-lg font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Features Preview */}
        <View className="flex-row justify-around px-5">
          <View className="items-center flex-1">
            <Text className="text-3xl mb-2">📊</Text>
            <Text className="text-sm text-gray-500 font-medium text-center">
              Track Progress
            </Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-3xl mb-2">🏆</Text>
            <Text className="text-sm text-gray-500 font-medium text-center">
              Set Goals
            </Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-3xl mb-2">📱</Text>
            <Text className="text-sm text-gray-500 font-medium text-center">
              Easy to Use
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default IndexScreen;
