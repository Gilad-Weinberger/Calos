import { useEffect, useRef, useState } from "react";

/**
 * Format seconds to MM:SS or HH:MM:SS format
 * @param seconds - Total seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Calculate elapsed time between two dates
 * @param startTime - Start timestamp
 * @param endTime - End timestamp (defaults to now)
 * @returns Elapsed time in seconds
 */
export const calculateElapsedTime = (
  startTime: Date,
  endTime: Date = new Date()
): number => {
  const diffMs = endTime.getTime() - new Date(startTime).getTime();
  return Math.floor(diffMs / 1000);
};

/**
 * Format duration in a human-readable way
 * @param seconds - Total seconds
 * @returns Formatted duration (e.g., "45 min", "1h 15min")
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes} min`;
  }

  return `${seconds}s`;
};

/**
 * Hook for a stopwatch (workout duration timer)
 * @param autoStart - Whether to start automatically
 * @returns {elapsedTime, isRunning, start, pause, reset, formattedTime}
 */
export const useStopwatch = (autoStart: boolean = false) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedTime * 1000;

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, elapsedTime]);

  const start = () => {
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };

  return {
    elapsedTime,
    isRunning,
    start,
    pause,
    reset,
    formattedTime: formatTime(elapsedTime),
  };
};

/**
 * Hook for a countdown timer (rest timer)
 * @param initialDuration - Initial countdown duration in seconds
 * @param onComplete - Callback when countdown reaches 0
 * @param autoStart - Whether to start automatically
 * @returns {timeLeft, isRunning, start, pause, reset, formattedTime}
 */
export const useCountdown = (
  initialDuration: number,
  onComplete?: () => void,
  autoStart: boolean = false
) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onCompleteRef = useRef(onComplete);
  const endTimeRef = useRef<number | null>(null);

  // Update ref when callback changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const timeLeftRef = useRef(timeLeft);

  // Update ref when timeLeft changes, but only for initial setup purposes
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    if (isRunning) {
      // If we're starting or resuming, calculate/recalculate the target end time
      // based on the current remaining seconds
      if (endTimeRef.current === null) {
        endTimeRef.current = Date.now() + timeLeftRef.current * 1000;
      }

      const interval = setInterval(() => {
        const now = Date.now();
        // Calculate exact remaining seconds
        const remaining = Math.max(
          0,
          Math.ceil((endTimeRef.current! - now) / 1000)
        );

        setTimeLeft(remaining);

        if (remaining <= 0) {
          // Timer finished
          clearInterval(interval);
          setIsRunning(false);
          endTimeRef.current = null;
          // Trigger callback immediately
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
      }, 100); // Check every 100ms for high precision and immediate finish

      return () => clearInterval(interval);
    } else {
      // If paused or stopped, clear the end time target
      endTimeRef.current = null;
    }
  }, [isRunning]); // Safe to omit timeLeft since we use ref for initial setup

  const start = () => {
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = (newDuration?: number) => {
    setIsRunning(false);
    setTimeLeft(newDuration ?? initialDuration);
    endTimeRef.current = null;
  };

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    formattedTime: formatTime(timeLeft),
  };
};
