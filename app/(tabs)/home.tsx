import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../../components/layout/TopBar";

const Home = () => {
  return (
    <View className="flex-1 bg-white">
      <TopBar
        title="Home"
        icons={[
          {
            name: "notifications",
            onPress: () => console.log("Bell pressed"),
          },
          {
            name: "search",
            onPress: () => console.log("Search pressed"),
          },
        ]}
      />
      <SafeAreaView
        className="flex-1 justify-center items-center"
        edges={["bottom", "left", "right"]}
      >
        <Text className="text-base text-gray-600 mt-4">
          Welcome to your fitness journey
        </Text>
      </SafeAreaView>
    </View>
  );
};

export default Home;
