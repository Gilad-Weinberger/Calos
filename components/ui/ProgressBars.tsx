import React from "react";
import { View } from "react-native";

interface ProgressBarsProps {
  total: number;
  completed: number;
  barHeight?: number;
  gap?: number;
}

const ProgressBars: React.FC<ProgressBarsProps> = ({
  total,
  completed,
  barHeight = 5,
  gap = 4,
}) => {
  return (
    <View className="flex-row">
      {Array.from({ length: total }).map((_, index) => {
        const isCompleted = index < completed;
        const isLast = index === total - 1;
        return (
          <View
            key={index}
            className={`flex-1 rounded-md ${
              isCompleted ? "bg-gray-800" : "bg-gray-300"
            }`}
            style={{ height: barHeight, marginRight: isLast ? 0 : gap }}
          />
        );
      })}
    </View>
  );
};

export default ProgressBars;
