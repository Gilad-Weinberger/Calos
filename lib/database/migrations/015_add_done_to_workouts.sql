-- Migration: Add done column to workouts table
-- This migration adds a done boolean field to track whether scheduled workouts have been completed

-- Add done column to workouts table
ALTER TABLE workouts 
ADD COLUMN done BOOLEAN DEFAULT false NOT NULL;

-- Create index for done queries (helps with filtering done/undone workouts)
CREATE INDEX idx_workouts_done ON workouts(done);
CREATE INDEX idx_workouts_plan_done ON workouts(plan_id, done) WHERE plan_id IS NOT NULL;
CREATE INDEX idx_workouts_scheduled_done ON workouts(scheduled_date, done) WHERE scheduled_date IS NOT NULL;

