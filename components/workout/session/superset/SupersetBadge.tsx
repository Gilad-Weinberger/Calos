import React from "react";
import { Text, View } from "react-native";

interface SupersetBadgeProps {
  index: number;
  total: number;
}

const SupersetBadge: React.FC<SupersetBadgeProps> = ({ index, total }) => {
  return (
    <View className="bg-blue-100 px-3 py-2 rounded-lg mb-3 self-start">
      <Text className="text-sm font-bold text-blue-700">
        SUPERSET ({index + 1} of {total})
      </Text>
    </View>
  );
};

export default SupersetBadge;


