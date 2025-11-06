import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface WorkoutCardHeaderProps {
  userName: string;
  userProfileImage: string | null;
  formattedDate: string;
  userId?: string;
  onUserPress: () => void;
  onMenuPress: () => void;
}

const WorkoutCardHeader: React.FC<WorkoutCardHeaderProps> = ({
  userName,
  userProfileImage,
  formattedDate,
  userId,
  onUserPress,
  onMenuPress,
}) => {
  return (
    <View className="flex-row items-center mb-3">
      <TouchableOpacity
        onPress={onUserPress}
        disabled={!userId}
        className="flex-row items-center flex-1"
        activeOpacity={userId ? 0.7 : 1}
      >
        <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center overflow-hidden mr-3">
          {userProfileImage ? (
            <Image
              source={{ uri: userProfileImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={24} color="white" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800">
            {userName}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="barbell" size={14} color="#6B7280" />
            <Text className="text-sm text-gray-600 ml-1">{formattedDate}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Menu Button */}
      <TouchableOpacity
        onPress={onMenuPress}
        className="p-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
};

export default WorkoutCardHeader;

