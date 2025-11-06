import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import {
  analyzePlanPdf,
  createPlanFromAnalysis,
  uploadPlanPdf,
} from "../../lib/functions/planFunctions";
import PlanUploadInitialState from "./PlanUploadInitialState";
import PlanUploadProgressState from "./PlanUploadProgressState";
import PlanUploadSuccessState from "./PlanUploadSuccessState";

interface PlanCreationPromptProps {
  onPlanCreated: () => void;
}

const PlanCreationPrompt: React.FC<PlanCreationPromptProps> = ({
  onPlanCreated,
}) => {
  const { user } = useAuth();
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

      // Call onPlanCreated callback to notify parent
      onPlanCreated();
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

  // Show progress state during upload or analysis
  if (isLoading && currentStep) {
    return (
      <PlanUploadProgressState
        currentStep={currentStep}
        uploadProgress={uploadProgress}
      />
    );
  }

  // PDF Uploaded - Show Instructions Form
  if (pdfUrl) {
    return (
      <PlanUploadSuccessState
        fileName={fileName}
        aiNotes={aiNotes}
        onAiNotesChange={setAiNotes}
        onCancel={handleCancelUpload}
        onAnalyze={handleAnalyzeAndReview}
        isAnalyzing={isAnalyzing}
      />
    );
  }

  // Initial state - show upload prompt
  return (
    <PlanUploadInitialState
      onSelectPDF={handleSelectPDF}
      isLoading={isLoading}
    />
  );
};

export default PlanCreationPrompt;

