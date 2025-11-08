import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Share, View } from "react-native";
import PlanWorkoutCTA from "./PlanWorkoutCTA";
import PlanWorkoutDescriptionCard from "./PlanWorkoutDescriptionCard";
import PlanWorkoutHeader from "./PlanWorkoutHeader";
import PlanWorkoutExerciseGroups from "./exercises/PlanWorkoutExerciseGroups";
import { createWorkoutBlocks, formatBlocksForText } from "./exercises/grouping";
import { PlanWorkoutViewModel } from "./types";

interface PlanWorkoutScreenProps {
  viewModel: PlanWorkoutViewModel;
  onBack: () => void;
}

const PlanWorkoutScreen: React.FC<PlanWorkoutScreenProps> = ({
  viewModel,
  onBack,
}) => {
  const router = useRouter();

  const scheduledLabel = useMemo(() => {
    if (!viewModel.scheduledDate) {
      return "Flexible day";
    }

    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(viewModel.scheduledDate);
  }, [viewModel.scheduledDate]);

  const workoutBlocks = useMemo(
    () => createWorkoutBlocks(viewModel.exercises),
    [viewModel.exercises]
  );

  const weekLabel = useMemo(() => {
    if (
      !viewModel.plan ||
      !viewModel.plan.start_date ||
      !viewModel.scheduledDate
    ) {
      return "Plan Workout";
    }

    const planStart = new Date(viewModel.plan.start_date);
    planStart.setHours(0, 0, 0, 0);

    const scheduled = new Date(viewModel.scheduledDate);
    scheduled.setHours(0, 0, 0, 0);

    const diffInMs = scheduled.getTime() - planStart.getTime();
    if (diffInMs < 0) {
      return "Upcoming Week";
    }

    const weekIndex = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));
    return `Week ${weekIndex + 1}`;
  }, [viewModel.plan, viewModel.scheduledDate]);

  const handleStart = () => {
    if (
      viewModel.isCompleted ||
      !viewModel.planId ||
      !viewModel.planWorkoutLetter ||
      !viewModel.scheduledDate
    ) {
      return;
    }

    router.push({
      pathname: "/workout/workout-session",
      params: {
        planId: viewModel.planId,
        workoutLetter: viewModel.planWorkoutLetter,
        scheduledDate: viewModel.scheduledDate.toISOString(),
      },
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${viewModel.title} • ${scheduledLabel}`,
      });
    } catch (error) {
      console.error("Error sharing workout:", error);
    }
  };

  const copyText = useMemo(() => {
    const blocksText = formatBlocksForText(workoutBlocks);
    const header = `${viewModel.title}${
      viewModel.planName ? ` — ${viewModel.planName}` : ""
    }`;
    return `${header}\n${scheduledLabel}\n\n${blocksText}`.trim();
  }, [scheduledLabel, viewModel.planName, viewModel.title, workoutBlocks]);

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <PlanWorkoutHeader
          viewModel={viewModel}
          onBack={onBack}
          onShare={handleShare}
          scheduledLabel={scheduledLabel}
          weekLabel={weekLabel}
        />

        <View className=" px-4">
          <PlanWorkoutDescriptionCard
            description={viewModel.description}
            copyText={copyText}
          />
          <View className="mt-6 mb-4 px-1">
            <PlanWorkoutExerciseGroups blocks={workoutBlocks} />
          </View>
        </View>
      </ScrollView>

      <PlanWorkoutCTA onStart={handleStart} disabled={viewModel.isCompleted} />
    </View>
  );
};

export default PlanWorkoutScreen;
