import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../../components/layout/TopBar";
import Progress from "../../components/you/Progress";
import TabNavigation from "../../components/you/TabNavigation";
import Workouts from "../../components/you/Workouts";

const You = () => {
  const [activeTab, setActiveTab] = useState<"Progress" | "Workouts">(
    "Workouts"
  );

  const renderContent = () => {
    switch (activeTab) {
      case "Progress":
        return <Progress />;
      case "Workouts":
        return <Workouts />;
      default:
        return <Progress />;
    }
  };

  return (
    <View className="flex-1 bg-white">
      <TopBar
        title="You"
        icons={[
          {
            name: "settings",
            onPress: () => console.log("Gear pressed"),
          },
        ]}
      />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SafeAreaView className="flex-1" edges={["bottom", "left", "right"]}>
        {renderContent()}
      </SafeAreaView>
    </View>
  );
};

export default You;
