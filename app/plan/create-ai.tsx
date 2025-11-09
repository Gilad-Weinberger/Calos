import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/context/AuthContext";

const CreatePlanAI = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");

  const handleGeneratePlan = async () => {
    if (!userPrompt.trim()) {
      Alert.alert(
        "Error",
        "Please describe what kind of workout plan you'd like to create."
      );
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to create a plan");
      return;
    }

    setIsGenerating(true);

    // TODO: Implement AI plan generation
    Alert.alert(
      "Coming Soon",
      "AI plan generation is coming soon! For now, please use the PDF upload option.",
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]
    );
    setIsGenerating(false);
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200 bg-white flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">
          Create Plan with AI
        </Text>
        <TouchableOpacity onPress={handleCancel} className="p-2">
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1 p-6">
        {/* Icon */}
        <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center mb-6 self-center">
          <Ionicons name="sparkles" size={48} color="#9333ea" />
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          Generate Your Workout Plan
        </Text>

        {/* Description */}
        <Text className="text-base text-gray-600 text-center mb-8 px-4">
          Describe your fitness goals, preferences, and experience level. Our AI
          will create a personalized workout plan tailored just for you.
        </Text>

        {/* Input Field */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            What kind of workout plan would you like?
          </Text>
          <TextInput
            className="bg-white rounded-lg p-4 border border-gray-200 text-gray-900 min-h-[120px]"
            placeholder="E.g., I want a 4-week strength training plan for beginners focusing on upper body and core. I can work out 3 times per week and prefer bodyweight exercises."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={userPrompt}
            onChangeText={setUserPrompt}
            editable={!isGenerating}
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={handleGeneratePlan}
          disabled={isGenerating || !userPrompt.trim()}
          className={`rounded-lg px-8 py-4 flex-row items-center justify-center ${
            isGenerating || !userPrompt.trim() ? "bg-gray-300" : "bg-purple-600"
          }`}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                Generating Plan...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                Generate Plan
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View className="mt-8 bg-gray-50 rounded-lg p-4">
          <Text className="text-sm text-gray-600 text-center">
            <Text className="font-semibold">Tip:</Text> Be specific about your
            goals, available days per week, experience level, equipment access,
            and any preferences (e.g., bodyweight only, focus on strength vs.
            cardio, etc.)
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CreatePlanAI;
