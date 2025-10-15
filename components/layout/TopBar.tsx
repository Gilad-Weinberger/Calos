import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IconConfig {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface TopBarProps {
  title: string;
  icons: IconConfig[];
}

const TopBar: React.FC<TopBarProps> = ({ title, icons }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200"
      style={{ paddingTop: insets.top + 12 }}
    >
      {/* Left side - Page title */}
      <Text className="text-2xl font-bold text-gray-800">{title}</Text>

      {/* Right side - Icons */}
      <View className="flex-row items-center space-x-4">
        {/* User profile circle */}
        <TouchableOpacity
          className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="person" size={16} color="white" />
        </TouchableOpacity>

        {/* Dynamic icons - reversed order */}
        {icons
          .slice()
          .reverse()
          .map((icon, index) => (
            <TouchableOpacity
              key={index}
              onPress={icon.onPress}
              className="w-8 h-8 items-center justify-center ml-5"
              activeOpacity={0.7}
            >
              <Ionicons name={icon.name} size={24} color="#6B7280" />
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
};

export default TopBar;
