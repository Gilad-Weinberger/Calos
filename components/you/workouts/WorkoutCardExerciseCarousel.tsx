import React from "react";
import { ScrollView } from "react-native";
import { WorkoutExercise } from "../../../lib/functions/workoutFunctions";
import { groupExercisesBySuperset } from "../../../lib/utils/superset";
import WorkoutCardExerciseItem from "./WorkoutCardExerciseItem";
import WorkoutCardSupersetItem from "./WorkoutCardSupersetItem";

interface WorkoutCardExerciseCarouselProps {
  exercises: WorkoutExercise[];
}

const WorkoutCardExerciseCarousel: React.FC<
  WorkoutCardExerciseCarouselProps
> = ({ exercises }) => {
  const groupedExercises = groupExercisesBySuperset(exercises);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-row"
      contentContainerStyle={{ paddingRight: 16 }}
    >
      {groupedExercises.map((group, groupIndex) => {
        if (group.isSuperset) {
          return (
            <WorkoutCardSupersetItem
              key={`superset-${groupIndex}`}
              exercises={group.exercises as WorkoutExercise[]}
              supersetGroup={group.exercises[0].superset_group || ""}
            />
          );
        } else {
          const workoutEx: WorkoutExercise = group
            .exercises[0] as WorkoutExercise;
          return (
            <WorkoutCardExerciseItem
              key={`${workoutEx.exercise_id}-${groupIndex}`}
              exercise={workoutEx}
            />
          );
        }
      })}
    </ScrollView>
  );
};

export default WorkoutCardExerciseCarousel;
