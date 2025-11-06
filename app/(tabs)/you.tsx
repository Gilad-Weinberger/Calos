import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppTopBar from "../../components/layout/AppTopBar";
import YouProgress from "../../components/you/YouProgress";
import YouTabNavigation from "../../components/you/YouTabNavigation";
import YouWorkouts from "../../components/you/YouWorkouts";

const You = () => {
  const [activeTab, setActiveTab] = useState<"Progress" | "Workouts">(
    "Workouts"
  );

  const renderContent = () => {
    switch (activeTab) {
      case "Progress":
        return <YouProgress />;
      case "Workouts":
        return <YouWorkouts />;
      default:
        return <YouProgress />;
    }
  };

  return (
    <View className="flex-1 bg-white">
      <AppTopBar
        title="You"
        icons={[
          {
            name: "settings",
            onPress: () => router.push("/settings"),
          },
        ]}
      />
      <YouTabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SafeAreaView className="flex-1" edges={["bottom", "left", "right"]}>
        {renderContent()}
      </SafeAreaView>
    </View>
  );
};

export default You;
