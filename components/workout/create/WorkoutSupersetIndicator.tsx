import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface WorkoutSupersetIndicatorProps {
  supersetGroup: string;
  onRemove: () => void;
}

const WorkoutSupersetIndicator: React.FC<WorkoutSupersetIndicatorProps> = ({
  supersetGroup,
  onRemove,
}) => {
  return (
    <View className="bg-blue-50 border-l-4 border-blue-500 px-3 py-1 mb-1">
      <View className="flex-row justify-between items-center">
        <Text className="text-xs font-bold text-blue-600">
          SUPERSET {supersetGroup}
        </Text>
        <TouchableOpacity onPress={onRemove}>
          <Text className="text-xs text-blue-600 underline">
            Remove from superset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WorkoutSupersetIndicator;

