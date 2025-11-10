import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlanCreationPrompt } from "../../components/plan/upload";

const CreatePlanPDF = () => {
  const router = useRouter();

  const handlePlanCreated = () => {
    // Navigate back to plan index after plan is created
    router.push("/(tabs)/plan" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <PlanCreationPrompt onPlanCreated={handlePlanCreated} />
    </SafeAreaView>
  );
};

export default CreatePlanPDF;
