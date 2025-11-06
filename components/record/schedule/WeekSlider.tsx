import React, { useEffect, useRef, useMemo } from "react";
import { Dimensions, FlatList, View } from "react-native";
import { Plan } from "../../../lib/functions/planFunctions";
import {
  getAbsoluteWeekNumber,
  getMaxWeekIndex,
  getWeekStartDateForIndex,
} from "../../../lib/utils/schedule";
import WeekSchedule from "./WeekSchedule";

interface WeekSliderProps {
  plan: Plan;
  initialWeekIndex: number;
  selectedDayIndex: number;
  onDaySelect: (dayIndex: number) => void;
  onWeekChange: (weekIndex: number) => void;
}

const WeekSlider: React.FC<WeekSliderProps> = ({
  plan,
  initialWeekIndex,
  selectedDayIndex,
  onDaySelect,
  onWeekChange,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const currentIndexRef = useRef(initialWeekIndex);
  const screenWidth = Dimensions.get("window").width;
  const maxWeekIndex = getMaxWeekIndex(plan.num_weeks, plan.plan_type);

  // For recurring plans, use a large number (1000 weeks = ~19 years)
  // For non-recurring plans, use num_weeks
  const totalWeeks = useMemo(() => {
    if (plan.plan_type === "repeat") {
      return 1000; // Large number for infinite scrolling
    }
    return plan.num_weeks;
  }, [plan.plan_type, plan.num_weeks]);

  // Generate week indices array
  const weekIndices = useMemo(() => {
    return Array.from({ length: totalWeeks }, (_, i) => i);
  }, [totalWeeks]);

  // Scroll to initial week only on mount or when index changes significantly
  useEffect(() => {
    if (flatListRef.current && initialWeekIndex >= 0) {
      // Only scroll if the index has actually changed (not just a re-render)
      if (currentIndexRef.current !== initialWeekIndex) {
        // Ensure index is within bounds
        const validIndex = Math.min(
          initialWeekIndex,
          maxWeekIndex !== null ? maxWeekIndex : totalWeeks - 1
        );
        currentIndexRef.current = validIndex;
        // Small delay to ensure layout is complete
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: validIndex,
            animated: false,
          });
        }, 100);
      }
    }
  }, [initialWeekIndex, maxWeekIndex, totalWeeks]);

  // Handle scroll end to detect week change
  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(offsetX / screenWidth);

    // Validate index bounds
    if (currentIndex >= 0 && currentIndex < totalWeeks) {
      // For non-recurring plans, ensure we don't exceed max
      if (maxWeekIndex !== null && currentIndex > maxWeekIndex) {
        return;
      }
      // Only call onWeekChange if index actually changed
      if (currentIndexRef.current !== currentIndex) {
        currentIndexRef.current = currentIndex;
        onWeekChange(currentIndex);
      }
    }
  };

  // Get week schedule index (for recurring plans, use modulo)
  const getWeekScheduleIndex = (absoluteWeekIndex: number): number => {
    if (plan.plan_type === "repeat") {
      return absoluteWeekIndex % plan.num_weeks;
    }
    return absoluteWeekIndex;
  };

  // Render week item
  const renderWeekItem = ({ item: weekIndex }: { item: number }) => {
    // For non-recurring plans, don't render weeks beyond the plan duration
    if (maxWeekIndex !== null && weekIndex > maxWeekIndex) {
      return <View style={{ width: screenWidth }} />;
    }

    const weekScheduleIndex = getWeekScheduleIndex(weekIndex);
    const weekStartDate = getWeekStartDateForIndex(
      new Date(plan.start_date),
      weekIndex
    );

    return (
      <View style={{ width: screenWidth }}>
        <WeekSchedule
          plan={plan}
          weekNumber={weekScheduleIndex}
          selectedDayIndex={selectedDayIndex}
          onDaySelect={onDaySelect}
          weekStartDate={weekStartDate}
        />
      </View>
    );
  };

  // Get item layout for performance
  const getItemLayout = (_: any, index: number) => ({
    length: screenWidth,
    offset: screenWidth * index,
    index,
  });

  return (
    <FlatList
      ref={flatListRef}
      data={weekIndices}
      renderItem={renderWeekItem}
      keyExtractor={(item) => `week-${item}`}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleScrollEnd}
      getItemLayout={getItemLayout}
      initialScrollIndex={
        maxWeekIndex !== null
          ? Math.min(initialWeekIndex, maxWeekIndex)
          : initialWeekIndex
      }
      onScrollToIndexFailed={(info) => {
        // Handle scroll to index failure
        const wait = new Promise((resolve) => setTimeout(resolve, 500));
        wait.then(() => {
          flatListRef.current?.scrollToIndex({
            index: info.index,
            animated: false,
          });
        });
      }}
    />
  );
};

export default WeekSlider;

