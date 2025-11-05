import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleSelectPDF = async () => {
    try {
      // Pick PDF file
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (
        pickerResult.canceled ||
        !pickerResult.assets ||
        pickerResult.assets.length === 0
      ) {
        return;
      }

      const file = pickerResult.assets[0];

      if (!user) {
        Alert.alert("Error", "You must be logged in to upload a plan");
        return;
      }

      // Step 1: Upload PDF
      setIsUploading(true);
      setCurrentStep("Uploading PDF to secure storage...");
      setUploadProgress(10);

      const uploadedPdfUrl = await uploadPlanPdf(
        user.user_id,
        file.uri,
        file.name
      );

      setUploadProgress(100);
      setCurrentStep("PDF uploaded successfully!");
      setIsUploading(false);

      // Store PDF URL for later analysis
      setPdfUrl(uploadedPdfUrl);
      setFileName(file.name);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentStep("");
      setPdfUrl(null);
      setFileName("");

      Alert.alert("Error", "Failed to upload PDF. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleAnalyzeAndReview = async () => {
    if (!pdfUrl || !user) return;

    try {
      setIsAnalyzing(true);
      setCurrentStep("Reading PDF content...");
      setUploadProgress(10);

      // Simulate reading step
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep("Detecting exercises and workout structure...");
      setUploadProgress(30);

      // Simulate exercise detection step
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep("Analyzing static vs dynamic exercises...");
      setUploadProgress(50);

      // Simulate exercise type analysis
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentStep("Identifying unilateral exercises and patterns...");
      setUploadProgress(70);

      // Simulate unilateral analysis
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentStep("Creating exercise database entries...");
      setUploadProgress(85);

      // Analyze PDF with user's instructions
      const analysisData = await analyzePlanPdf(
        pdfUrl,
        aiNotes.trim() || undefined,
        user.user_id
      );

      setCurrentStep("Creating workout plan...");
      setUploadProgress(95);

      // Automatically create plan from analysis
      await createPlanFromAnalysis(user.user_id, analysisData);

      setCurrentStep("Plan created successfully!");
      setUploadProgress(100);
      setIsAnalyzing(false);

      // Small delay to show success message
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Navigate to plan page
      router.push("/plan" as any);
    } catch (error) {
      console.error("Error creating plan:", error);
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

  const handleCancelUpload = () => {
    setPdfUrl(null);
    setFileName("");
    setUploadProgress(0);
    setCurrentStep("");
  };

  const isLoading = isUploading || isAnalyzing;

  // PDF Uploaded - Show Instructions Form or Loading State
  if (pdfUrl) {
    // Show loading state during analysis
    if (isAnalyzing) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
            {currentStep}
          </Text>
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
      );
    }

    // Show instructions form
    return (
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <View className="mb-6">
          <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4 self-center">
            <Ionicons name="checkmark-circle" size={32} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            PDF Uploaded Successfully
          </Text>
          <Text className="text-base text-gray-600 text-center mb-1">
            {fileName}
          </Text>
        </View>

        {/* AI Notes Input */}
        <View className="w-full mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            AI Instructions (Optional)
          </Text>
          <TextInput
            value={aiNotes}
            onChangeText={setAiNotes}
            placeholder="e.g., 'Ignore warmup exercises' or 'Focus on compound movements only'"
            multiline
            numberOfLines={4}
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
            textAlignVertical="top"
          />
          <Text className="text-xs text-gray-500 mt-1">
            Add specific instructions for the AI analyzer. These will be taken
            into account when analyzing your PDF.
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleCancelUpload}
            className="flex-1 bg-gray-200 rounded-lg px-6 py-4 items-center"
          >
            <Text className="text-gray-900 font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAnalyzeAndReview}
            className="flex-1 bg-blue-600 rounded-lg px-6 py-4 items-center flex-row justify-center"
            disabled={isAnalyzing}
          >
            <Ionicons name="analytics" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Analyze PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View className="mt-6 bg-gray-50 rounded-lg p-4">
          <Text className="text-sm text-gray-600 text-center">
            <Text className="font-semibold">Tip:</Text> Once you click
            &quot;Analyze PDF&quot;, the AI will process your workout plan using
            your instructions (if provided).
          </Text>
        </View>
      </ScrollView>
    );
  }

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
