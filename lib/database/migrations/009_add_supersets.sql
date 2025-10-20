-- Migration: Add Superset Support
-- Description: Add superset_group column to workout_exercises table for grouping exercises

-- Add superset_group column to workout_exercises table
ALTER TABLE workout_exercises 
  ADD COLUMN superset_group TEXT DEFAULT NULL;

-- Add index for superset queries
CREATE INDEX idx_workout_exercises_superset ON workout_exercises(workout_id, superset_group) 
  WHERE superset_group IS NOT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN workout_exercises.superset_group IS 
  'Identifier for grouping exercises into supersets. Exercises with the same non-null value are performed back-to-back without rest.';

