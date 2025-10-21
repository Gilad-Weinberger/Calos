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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prevTime - 1;
        });
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
  }, [isRunning, timeLeft, onComplete]);

  const start = () => {
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = (newDuration?: number) => {
    setIsRunning(false);
    setTimeLeft(newDuration ?? initialDuration);
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
