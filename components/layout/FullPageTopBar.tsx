import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IconConfig {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface FullPageTopBarProps {
  title: string;
  onBackPress?: () => void; // Optional custom back handler
  rightIcons?: IconConfig[]; // Optional right-side action icons
}

const FullPageTopBar: React.FC<FullPageTopBarProps> = ({
  title,
  onBackPress,
  rightIcons = [],
}) => {
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      className="bg-white border-b border-gray-200 px-4"
      style={{ paddingTop: insets.top + 12, paddingBottom: 6 }}
    >
      <View className="flex-row items-center">
        {/* Back button */}
        <TouchableOpacity
          onPress={handleBackPress}
          className="mr-4 p-2"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        {/* Title */}
        <Text className="text-xl font-bold text-gray-800 flex-1">{title}</Text>

        {/* Right side icons */}
        {rightIcons.map((icon, index) => (
          <TouchableOpacity
            key={index}
            onPress={icon.onPress}
            className="p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={icon.name} size={24} color="#374151" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default FullPageTopBar;
