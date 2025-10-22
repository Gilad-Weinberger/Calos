import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Text, View } from "react-native";
import { BarChart } from "react-native-chart-kit";

interface WorkoutStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  thisWeekWorkouts: number;
  thisWeekSets: number;
  thisWeekReps: number;
}

interface ProfileStatsProps {
  stats: WorkoutStats;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 40; // Account for padding

  // Create sample data for the last 3 months (similar to the design)
  const chartData = {
    labels: ["NOV", "DEC", "JAN"],
    datasets: [
      {
        data: [
          stats.thisWeekWorkouts * 4, // Rough estimate for November
          stats.thisWeekWorkouts * 4, // Rough estimate for December
          stats.thisWeekWorkouts, // Current week
        ],
        color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`, // Blue color
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#0066FF",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#E5E7EB",
      strokeWidth: 1,
    },
  };

  return (
    <View className="mb-6">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <Ionicons name="barbell-outline" size={20} color="#6B7280" />
        <Text className="text-lg font-semibold text-gray-800 ml-2">
          This week
        </Text>
      </View>

      {/* Stats Grid */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Workouts</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {stats.thisWeekWorkouts}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Sets</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {stats.thisWeekSets}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm text-gray-500 mb-1">Reps</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {stats.thisWeekReps}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View className="bg-white rounded-xl p-4 shadow-sm">
        <BarChart
          data={chartData}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          showValuesOnTopOfBars={false}
          fromZero={true}
          withInnerLines={false}
          withOuterLines={false}
          withHorizontalLabels={true}
          withVerticalLabels={false}
        />
      </View>

      {/* Total Stats */}
      <View className="mt-4 p-4 bg-gray-50 rounded-xl">
        <Text className="text-sm font-medium text-gray-700 mb-2">All Time</Text>
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Total Workouts</Text>
            <Text className="text-base font-semibold text-gray-800">
              {stats.totalWorkouts}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Total Sets</Text>
            <Text className="text-base font-semibold text-gray-800">
              {stats.totalSets}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Total Reps</Text>
            <Text className="text-base font-semibold text-gray-800">
              {stats.totalReps}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProfileStats;
