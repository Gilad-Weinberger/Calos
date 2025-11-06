import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/context/AuthContext";

interface IconConfig {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface AppTopBarProps {
  title: string;
  icons: IconConfig[];
}

const AppTopBar: React.FC<AppTopBarProps> = ({ title, icons }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const handleUserProfilePress = () => {
    if (user?.user_id) {
      router.push({
        pathname: "/profile/[id]",
        params: { id: user.user_id },
      });
    }
  };

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
          onPress={handleUserProfilePress}
          className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center overflow-hidden"
          activeOpacity={0.7}
        >
          {user?.profile_image_url ? (
            <Image
              source={{ uri: user.profile_image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={16} color="white" />
          )}
        </TouchableOpacity>

        {/* Dynamic icons - reversed order */}
        {icons
          .slice()
          .reverse()
          .map((icon, index) => (
            <TouchableOpacity
              key={index}
              onPress={icon.onPress}
              className="w-10 h-10 items-center justify-center ml-6"
              activeOpacity={0.7}
            >
              <Ionicons name={icon.name} size={26} color="#000000" />
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
};

export default AppTopBar;

