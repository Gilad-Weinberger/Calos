import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FullPageTopBar from "../../../components/layout/FullPageTopBar";
import {
  PlanDeleteButton,
  PlanMetadataEditor,
  PlanScheduleEditor,
  PlanWorkoutEditor,
  PlanWorkoutListEditor,
} from "../../../components/plan/manage";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  deletePlan,
  getPlanById,
  updatePlanWithWorkoutRecreation,
  validatePlanData,
  type Plan,
  type WorkoutDefinition,
} from "../../../lib/functions/planFunctions";

const ManagePlanPage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [editedPlan, setEditedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeWorkoutEditor, setActiveWorkoutEditor] = useState<{
    letter: string;
    workout: WorkoutDefinition;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const handleWorkoutEdit = (
    workoutLetter: string,
    workout: WorkoutDefinition
  ) => {
    setActiveWorkoutEditor({ letter: workoutLetter, workout });
  };

  const handleWorkoutSave = (
    workoutLetter: string,
    workout: WorkoutDefinition
  ) => {
    if (!editedPlan) return;

    const newWorkouts = { ...editedPlan.workouts };
    newWorkouts[workoutLetter] = workout;

    setEditedPlan({ ...editedPlan, workouts: newWorkouts });
    setActiveWorkoutEditor(null);
    setHasUnsavedChanges(true);
  };

  const handleWorkoutDelete = (workoutLetter: string) => {
    if (!editedPlan) return;

    const newWorkouts = { ...editedPlan.workouts };
    delete newWorkouts[workoutLetter];

    // Remove from schedule
    const newSchedule = editedPlan.schedule.map((week) =>
      week.map((day) =>
        day?.toUpperCase() === workoutLetter.toUpperCase() ? "Rest" : day
      )
    );

    setEditedPlan({
      ...editedPlan,
      workouts: newWorkouts,
      schedule: newSchedule,
    });
    setHasUnsavedChanges(true);
  };

  const handleWorkoutAdd = () => {
    if (!editedPlan) return;

    // Find next available letter
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let nextLetter = "";
    for (const letter of letters) {
      if (!editedPlan.workouts[letter]) {
        nextLetter = letter;
        break;
      }
    }

    if (!nextLetter) {
      Alert.alert("Error", "Maximum number of workouts reached (26)");
      return;
    }

    const newWorkout: WorkoutDefinition = {
      name: `Workout ${nextLetter}`,
      exercises: [],
    };

    setActiveWorkoutEditor({ letter: nextLetter, workout: newWorkout });
  };

  const handleScheduleChange = (schedule: string[][]) => {
    if (!editedPlan) return;
    setEditedPlan({ ...editedPlan, schedule });
    setHasUnsavedChanges(true);
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

      // Prepare updates (exclude fields that shouldn't be updated)
      const updates: Partial<Plan> = {
        name: editedPlan.name,
        description: editedPlan.description,
        workouts: editedPlan.workouts,
        schedule: editedPlan.schedule,
        num_weeks: editedPlan.num_weeks,
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

          <PlanWorkoutListEditor
            plan={editedPlan}
            onWorkoutEdit={handleWorkoutEdit}
            onWorkoutDelete={handleWorkoutDelete}
            onWorkoutAdd={handleWorkoutAdd}
          />

          <PlanScheduleEditor
            plan={editedPlan}
            onScheduleChange={handleScheduleChange}
          />

          <PlanDeleteButton onDelete={handleDelete} disabled={isDeleting} />

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`w-full py-4 rounded-lg mb-4 ${
              isSaving || !hasUnsavedChanges ? "bg-gray-300" : "bg-blue-600"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {isSaving ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Saving...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-lg text-center">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Workout Editor Modal */}
      {activeWorkoutEditor && (
        <PlanWorkoutEditor
          visible={!!activeWorkoutEditor}
          workoutLetter={activeWorkoutEditor.letter}
          workout={activeWorkoutEditor.workout}
          onClose={() => setActiveWorkoutEditor(null)}
          onSave={handleWorkoutSave}
        />
      )}
    </SafeAreaView>
  );
};

export default ManagePlanPage;
