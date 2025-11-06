import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

interface YouTabNavigationProps {
  activeTab: "Progress" | "Workouts";
  onTabChange: (tab: "Progress" | "Workouts") => void;
}

const YouTabNavigation: React.FC<YouTabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetPosition = activeTab === "Progress" ? 0 : 1;
    Animated.timing(indicatorPosition, {
      toValue: targetPosition,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [activeTab, indicatorPosition]);

  const tabs = ["Progress", "Workouts"] as const;

  return (
    <View className="bg-white border-b border-gray-100">
      <View className="flex-row px-4">
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabChange(tab)}
            className="flex-1 pt-6 pb-2"
            activeOpacity={0.7}
          >
            <Text
              className={`text-md font-semibold text-center ${
                activeTab === tab ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Animated indicator */}
      <View className="relative h-0.5 bg-gray-100">
        <Animated.View
          className="absolute top-0 h-0.5 bg-orange-500"
          style={{
            width: "25%",
            left: indicatorPosition.interpolate({
              inputRange: [0, 1],
              outputRange: ["14%", "60.5%"],
            }),
          }}
        />
      </View>
    </View>
  );
};

export default YouTabNavigation;


