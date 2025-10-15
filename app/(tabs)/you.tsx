import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../../components/layout/TopBar";

const You = () => {
  return (
    <View className="flex-1 bg-white">
      <TopBar
        title="You"
        icons={[
          {
            name: "search",
            onPress: () => console.log("Search pressed"),
          },
          {
            name: "settings",
            onPress: () => console.log("Gear pressed"),
          },
        ]}
      />
      <SafeAreaView
        className="flex-1 justify-center items-center"
        edges={["bottom", "left", "right"]}
      >
        <Text className="text-base text-gray-600">Your profile and stats</Text>
      </SafeAreaView>
    </View>
  );
};

export default You;
