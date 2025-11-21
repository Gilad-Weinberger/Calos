import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FullPageTopBar from "../layout/FullPageTopBar";

const ProfileLoadingState: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <FullPageTopBar
        title="Profile"
        rightIcons={[
          {
            name: "share-social-outline",
            onPress: () => {},
          },
        ]}
      />
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="text-gray-600 mt-2">Loading profile...</Text>
      </View>
    </SafeAreaView>
  );
};

export default ProfileLoadingState;
