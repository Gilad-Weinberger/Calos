import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
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
import { useAuth } from "../../lib/context/AuthContext";
import {
  analyzePlanPdf,
  createPlanFromAnalysis,
  uploadPlanPdf,
} from "../../lib/functions/planFunctions";

interface CreatePlanPromptProps {
  onPlanCreated: () => void;
}

const CreatePlanPrompt: React.FC<CreatePlanPromptProps> = ({
  onPlanCreated,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [aiNotes, setAiNotes] = useState("");

  const handleSelectPDF = async () => {
    try {
      // Pick PDF file
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];

      if (!user) {
        Alert.alert("Error", "You must be logged in to upload a plan");
        return;
      }

      // Step 1: Upload PDF
      setIsUploading(true);
      setCurrentStep("Uploading PDF to secure storage...");
      setUploadProgress(10);

      const pdfUrl = await uploadPlanPdf(user.user_id, file.uri, file.name);

      setUploadProgress(20);
      setCurrentStep("PDF uploaded successfully!");

      // Small delay to show the step
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsUploading(false);

      // Step 2: Analyze PDF
      setIsAnalyzing(true);
      setCurrentStep("Reading PDF content...");
      setUploadProgress(30);

      // Simulate reading step
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep("Detecting exercises and workout structure...");
      setUploadProgress(50);

      // Simulate exercise detection step
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep("Analyzing static vs dynamic exercises...");
      setUploadProgress(70);

      // Simulate exercise type analysis
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep("Identifying unilateral exercises and patterns...");
      setUploadProgress(85);

      // Simulate unilateral analysis
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentStep("Creating exercise database entries...");
      setUploadProgress(90);

      const analysisResult = await analyzePlanPdf(
        pdfUrl,
        aiNotes.trim() || undefined,
        user?.user_id
      );

      setCurrentStep("Finalizing workout plan...");
      setUploadProgress(95);

      // Step 3: Create plan
      const createdPlan = await createPlanFromAnalysis(
        user.user_id,
        analysisResult
      );

      setCurrentStep("Plan created successfully!");
      setUploadProgress(100);
      setIsAnalyzing(false);

      // Navigate to edit page in validation mode
      router.push(`/plan/edit/${createdPlan.plan_id}?isNew=true` as any);
    } catch (error) {
      console.error("Error creating plan:", error);
      setIsUploading(false);
      setIsAnalyzing(false);
      setUploadProgress(0);
      setCurrentStep("");

      Alert.alert(
        "Error",
        "Failed to create workout plan. Please make sure your PDF contains a valid workout plan and try again.",
        [{ text: "OK" }]
      );
    }
  };

  const isLoading = isUploading || isAnalyzing;

  return (
    <View className="flex-1 items-center justify-center p-6">
      {/* Icon */}
      <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-6">
        <Ionicons name="document-text" size={48} color="#2563eb" />
      </View>

      {/* Title */}
      <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
        Create Your First Workout Plan
      </Text>

      {/* Description */}
      <Text className="text-base text-gray-600 text-center mb-6 px-4">
        Upload a PDF of your workout plan and let AI analyze it to create your
        personalized training schedule
      </Text>

      {/* AI Notes Input */}
      {!isLoading && (
        <View className="w-full px-4 mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            AI Instructions (Optional)
          </Text>
          <TextInput
            value={aiNotes}
            onChangeText={setAiNotes}
            placeholder="e.g., 'Ignore warmup exercises' or 'Focus on compound movements only'"
            multiline
            numberOfLines={3}
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
            textAlignVertical="top"
          />
          <Text className="text-xs text-gray-500 mt-1">
            Add specific instructions for the AI analyzer
          </Text>
        </View>
      )}

      {/* Upload Button or Loading State */}
      {isLoading ? (
        <View className="items-center w-full">
          <ActivityIndicator size="large" color="#2563eb" />

          {/* Current Step */}
          <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
            {currentStep}
          </Text>

          {/* Progress Bar */}
          {uploadProgress > 0 && (
            <View className="w-full px-4 mt-4">
              <View className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </View>
              <Text className="text-sm text-gray-600 mt-2 text-center">
                {uploadProgress}% Complete
              </Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          onPress={handleSelectPDF}
          className="bg-blue-600 rounded-lg px-8 py-4 flex-row items-center"
        >
          <Ionicons name="cloud-upload" size={24} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">
            Upload PDF Plan
          </Text>
        </TouchableOpacity>
      )}

      {/* Help Text */}
      <View className="mt-8 bg-gray-50 rounded-lg p-4">
        <Text className="text-sm text-gray-600 text-center">
          <Text className="font-semibold">Tip:</Text> Your PDF should include
          workout names, exercises, sets, reps, and a weekly schedule for best
          results. Our AI can now detect static exercises (planks, wall sits)
          and unilateral exercises (archer push-ups, one-arm movements)
          automatically!
        </Text>
      </View>
    </View>
  );
};

export default CreatePlanPrompt;
