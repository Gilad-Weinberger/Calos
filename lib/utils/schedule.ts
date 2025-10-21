/**
 * Schedule calculation utilities for workout plans
 * Handles date calculations, week numbers, and workout scheduling
 */

/**
 * Calculate the number of days elapsed since the plan start date
 * @param startDate - When the plan was activated
 * @param targetDate - The date to calculate for (defaults to today)
 * @returns Number of days elapsed (0 = start date, 1 = next day, etc.)
 */
export const getDaysElapsed = (
  startDate: Date,
  targetDate: Date = new Date()
): number => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Get the week number within the plan (0-indexed)
 * Handles plan cycling for 'repeat' type plans
 * @param daysElapsed - Number of days since plan start
 * @param numWeeks - Total number of weeks in the plan
 * @param planType - 'repeat' or 'once'
 * @returns Week number (0-indexed), or null if plan is completed ('once' type)
 */
export const getWeekNumber = (
  daysElapsed: number,
  numWeeks: number,
  planType: "repeat" | "once"
): number | null => {
  const weekNumber = Math.floor(daysElapsed / 7);

  if (planType === "once") {
    // If plan is 'once' type and we're past the plan duration, return null
    if (weekNumber >= numWeeks) {
      return null;
    }
    return weekNumber;
  }

  // For 'repeat' type, cycle through weeks
  return weekNumber % numWeeks;
};

/**
 * Get the day of the week (0-6, where 0 = first day of week)
 * @param daysElapsed - Number of days since plan start
 * @returns Day of week (0-6)
 */
export const getDayInWeek = (daysElapsed: number): number => {
  return daysElapsed % 7;
};

/**
 * Get the scheduled workout letter for a specific date
 * @param startDate - When the plan was activated
 * @param schedule - Array of weekly schedules, e.g., [["A", "rest", "B", ...], ["B", "rest", "A", ...]]
 * @param numWeeks - Total number of weeks in the plan
 * @param planType - 'repeat' or 'once'
 * @param targetDate - The date to get the workout for (defaults to today)
 * @returns Workout letter (e.g., "A", "B", "C"), "rest", or null if plan is completed
 */
export const getScheduledWorkoutForDate = (
  startDate: Date,
  schedule: string[][],
  numWeeks: number,
  planType: "repeat" | "once",
  targetDate: Date = new Date()
): string | null => {
  const daysElapsed = getDaysElapsed(startDate, targetDate);

  // If target date is before plan start, return null
  if (daysElapsed < 0) {
    return null;
  }

  const weekNumber = getWeekNumber(daysElapsed, numWeeks, planType);

  // Plan is completed for 'once' type
  if (weekNumber === null) {
    return null;
  }

  const dayInWeek = getDayInWeek(daysElapsed);

  // Get the workout for this week and day
  if (weekNumber < schedule.length && dayInWeek < schedule[weekNumber].length) {
    return schedule[weekNumber][dayInWeek];
  }

  return null;
};

/**
 * Calculate how many days ago a workout was scheduled
 * @param scheduledDate - When the workout was scheduled
 * @param currentDate - Current date (defaults to today)
 * @returns Number of days (positive = past, negative = future, 0 = today)
 */
export const calculateDaysSinceScheduled = (
  scheduledDate: Date,
  currentDate: Date = new Date()
): number => {
  const scheduled = new Date(scheduledDate);
  scheduled.setHours(0, 0, 0, 0);

  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);

  const diffMs = current.getTime() - scheduled.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
};

/**
 * Get upcoming scheduled workouts for the next N days
 * @param startDate - When the plan was activated
 * @param schedule - Array of weekly schedules
 * @param numWeeks - Total number of weeks in the plan
 * @param planType - 'repeat' or 'once'
 * @param daysAhead - Number of days to look ahead (default 7)
 * @returns Array of {date, workoutLetter, weekNumber, dayInWeek}
 */
export const getUpcomingSchedule = (
  startDate: Date,
  schedule: string[][],
  numWeeks: number,
  planType: "repeat" | "once",
  daysAhead: number = 7
): {
  date: Date;
  workoutLetter: string;
  weekNumber: number | null;
  dayInWeek: number;
  isRestDay: boolean;
}[] => {
  const upcomingWorkouts: {
    date: Date;
    workoutLetter: string;
    weekNumber: number | null;
    dayInWeek: number;
    isRestDay: boolean;
  }[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);

    const workoutLetter = getScheduledWorkoutForDate(
      startDate,
      schedule,
      numWeeks,
      planType,
      targetDate
    );

    if (workoutLetter !== null) {
      const daysElapsed = getDaysElapsed(startDate, targetDate);
      const weekNumber = getWeekNumber(daysElapsed, numWeeks, planType);
      const dayInWeek = getDayInWeek(daysElapsed);

      upcomingWorkouts.push({
        date: targetDate,
        workoutLetter,
        weekNumber,
        dayInWeek,
        isRestDay: workoutLetter.toLowerCase() === "rest",
      });
    }
  }

  return upcomingWorkouts;
};

/**
 * Format a message about how late a workout is
 * @param scheduledDate - When the workout was scheduled
 * @returns Human-readable message (e.g., "You were supposed to do this workout 3 days ago")
 */
export const getLateworkoutMessage = (scheduledDate: Date): string => {
  const daysLate = calculateDaysSinceScheduled(scheduledDate);

  if (daysLate === 0) {
    return "Today's workout";
  } else if (daysLate === 1) {
    return "You were supposed to do this workout yesterday";
  } else if (daysLate > 1) {
    return `You were supposed to do this workout ${daysLate} days ago`;
  } else if (daysLate === -1) {
    return "This workout is scheduled for tomorrow";
  } else {
    return `This workout is scheduled for ${Math.abs(daysLate)} days from now`;
  }
};

/**
 * Calculate the scheduled date for today's workout
 * @param startDate - When the plan was activated
 * @returns Today's date at midnight
 */
export const getTodayScheduledDate = (startDate: Date): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * Format week and day display
 * @param weekNumber - Week number (0-indexed)
 * @param dayInWeek - Day in week (0-6)
 * @returns Formatted string (e.g., "Week 2, Day 3")
 */
export const formatWeekDay = (
  weekNumber: number,
  dayInWeek: number
): string => {
  return `Week ${weekNumber + 1}, Day ${dayInWeek + 1}`;
};
