import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import CreatePlanPrompt from "../../../components/record/CreatePlanPrompt";

const CreatePlan = () => {
  const router = useRouter();

  const handlePlanCreated = () => {
    // Navigate back to plan index after plan is created
    router.push("/(tabs)/plan");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <CreatePlanPrompt onPlanCreated={handlePlanCreated} />
    </SafeAreaView>
  );
};

export default CreatePlan;

