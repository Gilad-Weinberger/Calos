import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CreatePlanAIFormProvider,
  CreatePlanAIProgressIndicator,
  useCreatePlanAIForm,
} from "../../components/plan/create-ai";
import {
  StepActivityLevel,
  StepAvailableDays,
  StepMaxReps,
  StepPlanTarget,
  StepStartDate,
  StepUserData,
  StepWorkoutsPerWeek,
} from "../../components/plan/create-ai/steps";
import { useAuth } from "../../lib/context/AuthContext";
import {
  generateAIPlan,
  type AIPlanFormData,
} from "../../lib/functions/planFunctions";

const CreatePlanAIContent: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const {
    currentStep,
    formData,
    nextStep,
    previousStep,
    validateStep,
    hasUnsavedChanges,
  } = useCreatePlanAIForm();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlan = async () => {
    if (!validateStep(7)) {
      Alert.alert("Error", "Please complete all fields before generating.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to create a plan");
      return;
    }

    setIsGenerating(true);

    try {
      // Convert FormData to AIPlanFormData format
      const aiFormData: AIPlanFormData = {
        planTarget: formData.planTarget,
        specificExercise: formData.specificExercise,
        maxReps: formData.maxReps,
        age: formData.age,
        height: formData.height,
        heightUnit: formData.heightUnit,
        weight: formData.weight,
        weightUnit: formData.weightUnit,
        activityLevel: formData.activityLevel,
        currentWorkoutDays: formData.currentWorkoutDays,
        workoutsPerWeek: formData.workoutsPerWeek,
        availableDays: formData.availableDays,
        startDate: formData.startDate,
      };
      const plan = await generateAIPlan(aiFormData, user.user_id);

      Alert.alert(
        "Success",
        "Your workout plan has been created successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              router.push(`/plan/manage/${plan.plan_id}` as any);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error generating plan:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to generate plan. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to leave?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep();
    } else {
      Alert.alert("Validation Error", "Please complete all required fields.");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepPlanTarget />;
      case 2:
        return <StepMaxReps />;
      case 3:
        return <StepUserData />;
      case 4:
        return <StepActivityLevel />;
      case 5:
        return <StepWorkoutsPerWeek />;
      case 6:
        return <StepAvailableDays />;
      case 7:
        return <StepStartDate />;
      default:
        return null;
    }
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

      {/* Progress Indicator */}
      <CreatePlanAIProgressIndicator currentStep={currentStep} />

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        {renderStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-6 py-4 border-t border-gray-200 bg-white">
        <View className="flex-row gap-3">
          {currentStep > 1 && (
            <TouchableOpacity
              onPress={previousStep}
              disabled={isGenerating}
              className="flex-1 bg-gray-200 rounded-lg px-6 py-4 items-center"
            >
              <Text className="text-gray-700 font-semibold text-lg">Back</Text>
            </TouchableOpacity>
          )}
          {currentStep < 7 ? (
            <TouchableOpacity
              onPress={handleNext}
              disabled={isGenerating || !validateStep(currentStep)}
              className={`flex-1 rounded-lg px-6 py-4 items-center ${
                isGenerating || !validateStep(currentStep)
                  ? "bg-gray-300"
                  : "bg-blue-600"
              }`}
            >
              <Text className="text-white font-semibold text-lg">Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleGeneratePlan}
              disabled={isGenerating || !validateStep(currentStep)}
              className={`flex-1 rounded-lg px-6 py-4 items-center flex-row justify-center ${
                isGenerating || !validateStep(currentStep)
                  ? "bg-gray-300"
                  : "bg-blue-600"
              }`}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Generating...
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
          )}
        </View>
      </View>

      {/* Loading Overlay */}
      {isGenerating && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-xl p-6 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-900 font-semibold text-lg mt-4">
              Generating your plan...
            </Text>
            <Text className="text-gray-600 text-sm mt-2 text-center">
              This may take a few moments
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const CreatePlanAI = () => {
  return (
    <CreatePlanAIFormProvider>
      <CreatePlanAIContent />
    </CreatePlanAIFormProvider>
  );
};

export default CreatePlanAI;
