import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CreatePlanPrompt from "../../components/record/CreatePlanPrompt";
import TodaysWorkout from "../../components/record/TodaysWorkout";
import WorkoutForm from "../../components/record/WorkoutForm";
import { useAuth } from "../../lib/context/AuthContext";
import { getActivePlan, Plan } from "../../lib/functions/planFunctions";

const Record = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showManualWorkout, setShowManualWorkout] = useState(false);

  const loadActivePlan = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const plan = await getActivePlan(user.user_id);
      setActivePlan(plan);
    } catch (error) {
      console.error("Error loading active plan:", error);
      setActivePlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Reload plan when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadActivePlan();
    }, [user])
  );

  const handlePlanCreated = () => {
    loadActivePlan();
  };

  const handleManualWorkoutClose = () => {
    setShowManualWorkout(false);
    setMenuVisible(false);
  };

  // Show manual workout form modal
  if (showManualWorkout) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-200 bg-white flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">
            Create Workout Manually
          </Text>
          <TouchableOpacity onPress={handleManualWorkoutClose} className="p-2">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <WorkoutForm />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with Menu */}
      {activePlan && (
        <View className="px-4 py-3 border-b border-gray-200 bg-white flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">Record</Text>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            className="p-2"
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      {!activePlan ? (
        <CreatePlanPrompt onPlanCreated={handlePlanCreated} />
      ) : (
        <TodaysWorkout plan={activePlan} />
      )}

      {/* Options Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Options
            </Text>

            {/* Create Workout Manually */}
            <TouchableOpacity
              onPress={() => {
                setShowManualWorkout(true);
                setMenuVisible(false);
              }}
              className="flex-row items-center py-4 border-b border-gray-200"
            >
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Ionicons name="create" size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  Create Workout Manually
                </Text>
                <Text className="text-sm text-gray-600">
                  Add a custom workout with video or manual entry
                </Text>
              </View>
            </TouchableOpacity>

            {/* Create New Plan */}
            <TouchableOpacity
              onPress={() => {
                setActivePlan(null);
                setMenuVisible(false);
              }}
              className="flex-row items-center py-4"
            >
              <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                <Ionicons name="document-text" size={20} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900">
                  Create New Plan
                </Text>
                <Text className="text-sm text-gray-600">
                  Upload a new PDF workout plan
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => setMenuVisible(false)}
              className="mt-4 bg-gray-100 rounded-lg py-3"
            >
              <Text className="text-center text-gray-700 font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Record;
