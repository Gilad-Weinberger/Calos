import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FullPageTopBar from "../../../components/layout/FullPageTopBar";
import {
  PlanAIAssistantButton,
  PlanAIAssistantModal,
  PlanMetadataEditor,
  PlanSaveDeleteButtons,
  PlanScheduleViewer,
  PlanWorkoutListEditor,
} from "../../../components/plan/manage";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  deletePlan,
  getPlanById,
  updatePlanWithWorkoutRecreation,
  validatePlanData,
  type Plan,
} from "../../../lib/functions/planFunctions";

const ManagePlanPage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [editedPlan, setEditedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAIModalVisible, setIsAIModalVisible] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!id || !user?.user_id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const planData = await getPlanById(id, user.user_id);
      if (planData) {
        setEditedPlan({ ...planData });
        setHasUnsavedChanges(false);
      } else {
        Alert.alert("Error", "Plan not found", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error("Error loading plan:", error);
      Alert.alert("Error", "Failed to load plan", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [id, user, router]);

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [loadPlan])
  );

  const handleNameChange = (name: string) => {
    if (!editedPlan) return;
    setEditedPlan({ ...editedPlan, name });
    setHasUnsavedChanges(true);
  };

  const handleDescriptionChange = (description: string) => {
    if (!editedPlan) return;
    setEditedPlan({ ...editedPlan, description });
    setHasUnsavedChanges(true);
  };

  const handleAIAssistantPress = () => {
    setIsAIModalVisible(true);
  };

  const handleAIChangesAccepted = (modifiedData: {
    workouts: Plan["workouts"];
    schedule: Plan["schedule"];
    num_weeks: number;
    start_date: string;
  }) => {
    if (!editedPlan) return;

    // Apply AI-suggested changes to the edited plan
    setEditedPlan({
      ...editedPlan,
      workouts: modifiedData.workouts,
      schedule: modifiedData.schedule,
      num_weeks: modifiedData.num_weeks,
      start_date: modifiedData.start_date,
    });
    setHasUnsavedChanges(true);
    setIsAIModalVisible(false);
  };

  const handleSave = async () => {
    if (!editedPlan || !id || !user?.user_id) return;

    // Validate plan
    const validation = validatePlanData(editedPlan);
    if (!validation.valid) {
      Alert.alert("Validation Error", validation.errors.join("\n"), [
        { text: "OK" },
      ]);
      return;
    }

    try {
      setIsSaving(true);

      // Prepare updates (include all fields that may have changed)
      const updates: Partial<Plan> = {
        name: editedPlan.name,
        description: editedPlan.description,
        workouts: editedPlan.workouts,
        schedule: editedPlan.schedule,
        num_weeks: editedPlan.num_weeks,
        start_date: editedPlan.start_date,
      };

      await updatePlanWithWorkoutRecreation(id, user.user_id, updates);

      Alert.alert("Success", "Plan updated successfully", [
        {
          text: "OK",
          onPress: () => {
            setHasUnsavedChanges(false);
            loadPlan();
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error saving plan:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to save plan. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user?.user_id) return;

    try {
      setIsDeleting(true);
      await deletePlan(id, user.user_id);
      Alert.alert("Success", "Plan deleted successfully", [
        {
          text: "OK",
          onPress: () => router.push("/(tabs)/plan" as any),
        },
      ]);
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to delete plan. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackPress = () => {
    if (hasUnsavedChanges) {
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

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <FullPageTopBar title="Manage Plan" onBackPress={handleBackPress} />
        <SafeAreaView
          className="flex-1 items-center justify-center bg-gray-50"
          edges={["bottom", "left", "right"]}
        >
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-600 mt-4">Loading plan...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (!editedPlan) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <FullPageTopBar title="Manage Plan" onBackPress={handleBackPress} />
        <SafeAreaView
          className="flex-1 items-center justify-center bg-gray-50"
          edges={["bottom", "left", "right"]}
        >
          <Text className="text-gray-600">Plan not found</Text>
        </SafeAreaView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FullPageTopBar title="Manage Plan" onBackPress={handleBackPress} />
      <SafeAreaView className="flex-1" edges={["bottom", "left", "right"]}>
        <ScrollView className="flex-1 p-4">
          <PlanMetadataEditor
            plan={editedPlan}
            onNameChange={handleNameChange}
            onDescriptionChange={handleDescriptionChange}
          />

          <PlanScheduleViewer plan={editedPlan} />

          <PlanWorkoutListEditor plan={editedPlan} />

          {/* Save and Delete Buttons */}
          <PlanSaveDeleteButtons
            onSave={handleSave}
            onDelete={handleDelete}
            isSaving={isSaving}
            isDeleting={isDeleting}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </ScrollView>
      </SafeAreaView>

      {/* AI Assistant Modal */}
      {editedPlan && (
        <PlanAIAssistantModal
          visible={isAIModalVisible}
          currentPlan={editedPlan}
          onClose={() => setIsAIModalVisible(false)}
          onAcceptChanges={handleAIChangesAccepted}
        />
      )}

      {/* AI Assistant Floating Button */}
      {editedPlan && <PlanAIAssistantButton onPress={handleAIAssistantPress} />}
    </SafeAreaView>
  );
};

export default ManagePlanPage;
