import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../../components/layout/TopBar";

const Groups = () => {
  return (
    <View className="flex-1 bg-white">
      <TopBar
        title="Groups"
        icons={[
          {
            name: "chatbubble",
            onPress: () => console.log("Chat pressed"),
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
        <Text className="text-base text-gray-600">
          Connect with other athletes
        </Text>
      </SafeAreaView>
    </View>
  );
};

export default Groups;
