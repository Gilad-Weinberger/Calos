-- Migration: Add duration support for static exercises in workout plans
-- This migration adds support for static (timed) exercises alongside dynamic (rep-based) exercises

-- No schema changes needed as we're using JSONB for workouts
-- The duration field will be added to the JSONB structure in the application layer

-- Add a comment to document the new structure
COMMENT ON COLUMN plans.workouts IS 'JSONB structure: { "A": { "name": "Workout A", "exercises": [{ "exercise_id": "uuid", "exercise_name": "string", "sets": number, "reps": number (for dynamic), "duration": number (for static, in seconds), "rest_seconds": number, "superset_group": "string" }] } }';

-- Update any existing plans to ensure they have the new structure
-- This is a no-op migration since we're handling the structure in the application layer
