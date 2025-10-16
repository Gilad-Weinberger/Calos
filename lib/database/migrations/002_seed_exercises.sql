-- Seed exercises table with popular calisthenics exercises
-- This migration adds 8-10 common calisthenics exercises

INSERT INTO exercises (name, description, type) VALUES
-- Dynamic exercises (repetition-based)
('Push-ups', 'Classic bodyweight chest and arm exercise', 'dynamic'),
('Pull-ups', 'Upper body pulling exercise targeting back and biceps', 'dynamic'),
('Dips', 'Tricep and chest exercise using parallel bars or rings', 'dynamic'),
('Squats', 'Lower body exercise targeting quadriceps and glutes', 'dynamic'),
('Lunges', 'Single-leg lower body exercise for strength and balance', 'dynamic'),
('Hanging Leg Raises', 'Core exercise performed hanging from a bar', 'dynamic'),
('Handstand Push-ups', 'Advanced upper body exercise in inverted position', 'dynamic'),
('Muscle-ups', 'Advanced compound exercise combining pull-up and dip', 'dynamic'),

-- Static exercises (time-based)
('Plank', 'Core strengthening exercise held in push-up position', 'static'),
('L-sit', 'Advanced core exercise holding legs parallel to ground', 'static');

-- Note: For static exercises, the reps array will contain time values in seconds
-- For dynamic exercises, the reps array will contain actual repetition counts
