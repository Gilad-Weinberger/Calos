import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

interface WorkoutStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalDuration: number;
  thisWeekWorkouts: number;
  thisWeekSets: number;
  thisWeekReps: number;
  thisWeekDuration: number;
  weeklyData: {
    weekLabel: string;
    workouts: number;
    sets: number;
    duration: number;
  }[];
}

interface ProfileStatsProps {
  stats: WorkoutStats;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth; // Account for padding

  // Activity type selection state
  const [selectedActivityType, setSelectedActivityType] = useState<
    "workouts" | "sets" | "duration"
  >("workouts");

  // Get data based on selected activity type
  const getChartData = () => {
    let data: number[] = [];
    switch (selectedActivityType) {
      case "sets":
        data = stats.weeklyData.map((week) => week.sets);
        break;
      case "duration":
        data = stats.weeklyData.map((week) => Math.round(week.duration / 60)); // Convert to hours
        break;
      default:
        data = stats.weeklyData.map((week) => week.workouts);
    }

    // Ensure data has at least 2 valid numbers and add 0 if all values are the same to avoid infinity
    if (data.length === 0) {
      return [0, 0];
    }
    if (data.length === 1) {
      return [0, data[0]];
    }
    // If all values are the same, add a 0 to create variation
    const allSame = data.every((val) => val === data[0]);
    if (allSame && data[0] !== 0) {
      return [0, ...data];
    }
    return data;
  };

  // Create chart data from weekly data with unique month labels
  const createChartLabels = (): string[] => {
    const labels: string[] = [];
    const seenMonths = new Set<string>();

    // If we need to add a 0 at the beginning for variation
    const chartDataArray = getChartData();
    const needsExtraLabel = chartDataArray.length > stats.weeklyData.length;

    if (needsExtraLabel) {
      labels.push("");
    }

    stats.weeklyData.forEach((week, index) => {
      const month = week.weekLabel.split(" ")[0];
      if (!seenMonths.has(month)) {
        labels.push(month);
        seenMonths.add(month);
      } else {
        labels.push(""); // Empty string for repeated months
      }
    });

    return labels;
  };

  const chartData = {
    labels: createChartLabels(),
    datasets: [
      {
        data: getChartData(),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue color
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue color
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#3B82F6",
      fill: "#3B82F6",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#E5E7EB",
      strokeWidth: 1,
    },
    fillShadowGradient: "#3B82F6",
    fillShadowGradientOpacity: 0.2,
  };

  return (
    <View className="px-6 py-2 pb-0">
      {/* Activity Type Selection */}
      <View className="flex-row mb-4">
        <TouchableOpacity
          onPress={() => setSelectedActivityType("workouts")}
          className={`mr-2 py-2 px-3 rounded-lg border ${
            selectedActivityType === "workouts"
              ? "bg-blue-50 border-blue-500"
              : "bg-white border-gray-300"
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="barbell-outline"
              size={16}
              color={
                selectedActivityType === "workouts" ? "#3B82F6" : "#6B7280"
              }
            />
            <Text
              className={`ml-2 text-sm font-medium ${
                selectedActivityType === "workouts"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Workouts
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedActivityType("sets")}
          className={`mr-2 py-2 px-3 rounded-lg border ${
            selectedActivityType === "sets"
              ? "bg-blue-50 border-blue-500"
              : "bg-white border-gray-300"
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="repeat-outline"
              size={16}
              color={selectedActivityType === "sets" ? "#3B82F6" : "#6B7280"}
            />
            <Text
              className={`ml-2 text-sm font-medium ${
                selectedActivityType === "sets"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Sets
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedActivityType("duration")}
          className={`py-2 px-3 rounded-lg border ${
            selectedActivityType === "duration"
              ? "bg-blue-50 border-blue-500"
              : "bg-white border-gray-300"
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="time-outline"
              size={16}
              color={
                selectedActivityType === "duration" ? "#3B82F6" : "#6B7280"
              }
            />
            <Text
              className={`ml-2 text-sm font-medium ${
                selectedActivityType === "duration"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              Duration
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      {/* Header */}
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        This week
      </Text>

      {/* Stats Grid */}
      <View className="flex-row gap-5 mb-4">
        <View className="">
          <Text className="text-sm text-gray-500 mb-1">Workouts</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {stats.thisWeekWorkouts}
          </Text>
        </View>
        <View className="">
          <Text className="text-sm text-gray-500 mb-1">Total Sets</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {stats.thisWeekSets}
          </Text>
        </View>
        <View className="">
          <Text className="text-sm text-gray-500 mb-1">Duration</Text>
          <Text className="text-lg font-semibold text-gray-800">
            {Math.floor(stats.thisWeekDuration / 60)}h{" "}
            {stats.thisWeekDuration % 60}m
          </Text>
        </View>
      </View>

      {/* Chart */}
      {stats.weeklyData && stats.weeklyData.length > 0 ? (
        <View className="bg-white rounded-xl -ml-12">
          <LineChart
            data={chartData}
            width={chartWidth}
            height={200}
            chartConfig={chartConfig}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            bezier={true}
            withDots={true}
            withShadow={true}
            withScrollableDot={false}
            withInnerLines={true}
            withOuterLines={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            fromZero={false}
            segments={4}
          />
        </View>
      ) : (
        <View className="bg-gray-50 rounded-xl p-6 items-center">
          <Ionicons name="bar-chart-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2 text-center">
            No workout history yet
          </Text>
          <Text className="text-gray-400 text-sm mt-1 text-center">
            Complete workouts to see your progress
          </Text>
        </View>
      )}
    </View>
  );
};

export default ProfileStats;
