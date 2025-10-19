import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface AchievementIconProps {
  type: "trophy" | "medal";
  rank?: number; // 1 for gold/PR, 2 for silver, 3 for bronze
  size?: number;
}

const AchievementIcon: React.FC<AchievementIconProps> = ({
  type,
  rank = 1,
  size = 24,
}) => {
  // Determine color based on rank
  const getColor = () => {
    switch (rank) {
      case 1:
        return "#F59E0B"; // Gold/Amber
      case 2:
        return "#9CA3AF"; // Silver/Gray
      case 3:
        return "#CD7F32"; // Bronze
      default:
        return "#F59E0B"; // Default to gold
    }
  };

  // Determine icon name based on type
  const iconName = type === "trophy" ? "trophy" : "medal";

  return <Ionicons name={iconName} size={size} color={getColor()} />;
};

export default AchievementIcon;
