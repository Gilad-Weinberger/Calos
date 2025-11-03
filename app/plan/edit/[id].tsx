import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FullPageTopBar from "../../../components/layout/FullPageTopBar";
import PlanEditActions from "../../../components/plan-edit/PlanEditActions";
import PlanMetadataForm from "../../../components/plan-edit/PlanMetadataForm";
import ScheduleEditor from "../../../components/plan-edit/ScheduleEditor";
import WorkoutsList from "../../../components/plan-edit/WorkoutsList";
import { useAuth } from "../../../lib/context/AuthContext";
import {
  deletePlan,
  getPlanById,
  Plan,
  updatePlan,
  WorkoutDefinition,
  WorkoutDefinitions,
} from "../../../lib/functions/planFunctions";

const PlanEditScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // Get isNew param from URL
  const searchParams = useLocalSearchParams();
  const isNew = searchParams.isNew === "true";
  const mode: "validation" | "edit" = isNew ? "validation" : "edit";

  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [planType, setPlanType] = useState<"repeat" | "once">("repeat");
  const [numWeeks, setNumWeeks] = useState(4);
  const [startDate, setStartDate] = useState("");
  const [workouts, setWorkouts] = useState<WorkoutDefinitions>({});
  const [schedule, setSchedule] = useState<string[][]>([]);

  const loadPlan = useCallback(async () => {
    if (!id || !user?.user_id) return;

    try {
      setIsLoading(true);
      const planData = await getPlanById(id, user.user_id);

      if (!planData) {
        Alert.alert("Error", "Plan not found");
        router.back();
        return;
      }

      setPlan(planData);
      setName(planData.name);
      setDescription(planData.description || "");
      setPlanType(planData.plan_type);
      setNumWeeks(planData.num_weeks);
      setStartDate(planData.start_date);
      setWorkouts(planData.workouts);
      setSchedule(planData.schedule);
    } catch (error) {
      console.error("Error loading plan:", error);
      Alert.alert("Error", "Failed to load plan data");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.user_id, router]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleWorkoutUpdate = (
    workoutLetter: string,
    updatedWorkout: WorkoutDefinition
  ) => {
    setWorkouts({
      ...workouts,
      [workoutLetter]: updatedWorkout,
    });
  };

  const validatePlan = (): boolean => {
    // Check plan has at least 1 workout
    const workoutKeys = Object.keys(workouts);
    if (workoutKeys.length === 0) {
      Alert.alert(
        "Validation Error",
        "Plan must have at least one workout defined."
      );
      return false;
    }

    // Check each workout has at least 1 exercise
    for (const letter of workoutKeys) {
      const workout = workouts[letter];
      if (workout.exercises.length === 0) {
        Alert.alert(
          "Validation Error",
          `Workout ${letter} must have at least one exercise.`
        );
        return false;
      }

      // Check all exercises have required fields
      for (const exercise of workout.exercises) {
        if (
          !exercise.exercise_id ||
          !exercise.exercise_name ||
          exercise.sets <= 0 ||
          exercise.rest_seconds < 0
        ) {
          Alert.alert(
            "Validation Error",
            `Exercise "${exercise.exercise_name}" in Workout ${letter} has incomplete data.`
          );
          return false;
        }

        // Check reps or duration is set
        if (
          (exercise.reps === undefined || exercise.reps <= 0) &&
          (exercise.duration === undefined || exercise.duration <= 0)
        ) {
          Alert.alert(
            "Validation Error",
            `Exercise "${exercise.exercise_name}" in Workout ${letter} must have reps or duration set.`
          );
          return false;
        }
      }
    }

    // Check schedule references valid workouts
    for (let weekIndex = 0; weekIndex < schedule.length; weekIndex++) {
      for (let dayIndex = 0; dayIndex < schedule[weekIndex].length; dayIndex++) {
        const scheduledWorkout = schedule[weekIndex][dayIndex];
        if (
          scheduledWorkout.toLowerCase() !== "rest" &&
          !workouts[scheduledWorkout]
        ) {
          Alert.alert(
            "Validation Error",
            `Schedule references workout "${scheduledWorkout}" which is not defined.`
          );
          return false;
        }
      }
    }

    // Check schedule has correct dimensions
    if (schedule.length !== numWeeks) {
      Alert.alert(
        "Validation Error",
        "Schedule length does not match number of weeks."
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!user || !id) return;

    // Validate before saving
    if (!validatePlan()) {
      return;
    }

    try {
      setIsSaving(true);

      await updatePlan(id, user.user_id, {
        name: name.trim(),
        description: description.trim() || null,
        plan_type: planType,
        num_weeks: numWeeks,
        workouts,
        schedule,
      });

      Alert.alert(
        "Success",
        mode === "validation"
          ? "Your workout plan has been saved successfully!"
          : "Plan updated successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              if (mode === "validation") {
                router.replace("/(tabs)/record");
              } else {
                router.back();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error saving plan:", error);
      Alert.alert("Error", "Failed to save plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecondaryAction = () => {
    if (mode === "validation") {
      // Discard - delete plan and go back
      Alert.alert(
        "Discard Plan",
        "Are you sure you want to discard this plan? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: async () => {
              if (!user || !id) return;

              try {
                setIsProcessing(true);
                await deletePlan(id, user.user_id);
                router.replace("/(tabs)/record");
              } catch (error) {
                console.error("Error discarding plan:", error);
                Alert.alert(
                  "Error",
                  "Failed to discard plan. Please try again."
                );
              } finally {
                setIsProcessing(false);
              }
            },
          },
        ]
      );
    } else {
      // Cancel - just go back without saving
      Alert.alert(
        "Cancel Changes",
        "Are you sure you want to cancel? Any unsaved changes will be lost.",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Cancel",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 mt-4">Loading plan...</Text>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-600">Plan not found</Text>
        <TouchableOpacity
          className="mt-4 px-6 py-2 bg-blue-500 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const availableWorkouts = Object.keys(workouts).sort();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <FullPageTopBar
          title={mode === "validation" ? "Review Plan" : "Edit Plan"}
        />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4 gap-y-6">
            {/* Info Banner for Validation Mode */}
            {mode === "validation" && (
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <Text className="text-blue-800 font-semibold mb-1">
                  Review Your Plan
                </Text>
                <Text className="text-blue-700 text-sm">
                  Please review and edit your workout plan before saving. You
                  can modify workouts, exercises, and the schedule.
                </Text>
              </View>
            )}

            {/* Plan Metadata */}
            <PlanMetadataForm
              name={name}
              description={description}
              planType={planType}
              numWeeks={numWeeks}
              startDate={startDate}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onPlanTypeChange={setPlanType}
              onNumWeeksChange={setNumWeeks}
              onStartDateChange={setStartDate}
            />

            {/* Workouts List */}
            <WorkoutsList
              workouts={workouts}
              onWorkoutUpdate={handleWorkoutUpdate}
            />

            {/* Schedule Editor */}
            <ScheduleEditor
              schedule={schedule}
              numWeeks={numWeeks}
              availableWorkouts={availableWorkouts}
              onScheduleChange={setSchedule}
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <PlanEditActions
          mode={mode}
          onSave={handleSave}
          onSecondaryAction={handleSecondaryAction}
          isSaving={isSaving}
          isProcessing={isProcessing}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PlanEditScreen;

