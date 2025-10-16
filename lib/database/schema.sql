-- Database Schema for Users and Exercises
-- Complete production-ready setup for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE exercise_type AS ENUM ('static', 'dynamic');

-- Create tables

-- 1. Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Exercises table
CREATE TABLE exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type exercise_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workouts table
CREATE TABLE workouts (
    workout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    workout_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Workout exercises table (junction table for workout exercises)
CREATE TABLE workout_exercises (
    workout_exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID NOT NULL REFERENCES workouts(workout_id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    sets INTEGER NOT NULL,
    reps INTEGER[] NOT NULL, -- array of integers for reps per set
    order_index INTEGER NOT NULL, -- order of exercise in workout
    rest_seconds INTEGER, -- rest time in seconds until next exercise
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);


-- Workouts table indexes
CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_workouts_date ON workouts(workout_date);

-- Workout exercises table indexes
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id);
CREATE INDEX idx_workout_exercises_workout_order ON workout_exercises(workout_id, order_index);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users table policies
CREATE POLICY "Users can read their own profile" ON users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Exercises table policies
CREATE POLICY "Exercises are publicly readable" ON exercises
    FOR SELECT USING (true);

CREATE POLICY "Only service role can modify exercises" ON exercises
    FOR ALL USING (auth.role() = 'service_role');


-- Workouts table policies
CREATE POLICY "Users can read their own workouts" ON workouts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own workouts" ON workouts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workouts" ON workouts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workouts" ON workouts
    FOR DELETE USING (user_id = auth.uid());

-- Workout exercises table policies
CREATE POLICY "Users can read exercises from their own workouts" ON workout_exercises
    FOR SELECT USING (
        workout_id IN (
            SELECT workout_id FROM workouts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add exercises to their own workouts" ON workout_exercises
    FOR INSERT WITH CHECK (
        workout_id IN (
            SELECT workout_id FROM workouts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update exercises in their own workouts" ON workout_exercises
    FOR UPDATE USING (
        workout_id IN (
            SELECT workout_id FROM workouts WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete exercises from their own workouts" ON workout_exercises
    FOR DELETE USING (
        workout_id IN (
            SELECT workout_id FROM workouts WHERE user_id = auth.uid()
        )
    );

-- Helper functions

-- Get user's personal records from workout exercises (best performance for each exercise)
CREATE OR REPLACE FUNCTION get_user_personal_records(p_user_id UUID)
RETURNS TABLE (
    exercise_id UUID,
    exercise_name TEXT,
    exercise_type exercise_type,
    amount INTEGER,
    achieved_at TIMESTAMPTZ,
    workout_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH exercise_performances AS (
        SELECT 
            we.exercise_id,
            e.name,
            e.type,
            w.workout_date,
            w.workout_id,
            GREATEST(we.reps) as performance_amount -- For both static and dynamic exercises, use max reps in single set
        FROM workout_exercises we
        JOIN exercises e ON e.exercise_id = we.exercise_id
        JOIN workouts w ON w.workout_id = we.workout_id
        WHERE w.user_id = p_user_id
        GROUP BY we.exercise_id, e.name, e.type, w.workout_date, w.workout_id, we.reps
    ),
    ranked_performances AS (
        SELECT 
            exercise_id,
            name,
            type,
            workout_date,
            workout_id,
            performance_amount,
            ROW_NUMBER() OVER (
                PARTITION BY exercise_id 
                ORDER BY performance_amount DESC, workout_date DESC
            ) as rn
        FROM exercise_performances
    )
    SELECT 
        exercise_id,
        name,
        type,
        performance_amount as amount,
        workout_date as achieved_at,
        workout_id
    FROM ranked_performances
    WHERE rn = 1
    ORDER BY exercise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's personal record for a specific exercise from workout exercises
CREATE OR REPLACE FUNCTION get_user_personal_record(p_user_id UUID, p_exercise_id UUID)
RETURNS TABLE (
    exercise_id UUID,
    exercise_name TEXT,
    exercise_type exercise_type,
    amount INTEGER,
    achieved_at TIMESTAMPTZ,
    workout_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH exercise_performances AS (
        SELECT 
            we.exercise_id,
            e.name,
            e.type,
            w.workout_date,
            w.workout_id,
            GREATEST(we.reps) as performance_amount -- For both static and dynamic exercises, use max reps in single set
        FROM workout_exercises we
        JOIN exercises e ON e.exercise_id = we.exercise_id
        JOIN workouts w ON w.workout_id = we.workout_id
        WHERE w.user_id = p_user_id 
            AND we.exercise_id = p_exercise_id
        GROUP BY we.exercise_id, e.name, e.type, w.workout_date, w.workout_id, we.reps
    )
    SELECT 
        exercise_id,
        name,
        type,
        performance_amount as amount,
        workout_date as achieved_at,
        workout_id
    FROM exercise_performances
    ORDER BY performance_amount DESC, workout_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's best N attempts for a specific exercise (ranked from best to worst)
CREATE OR REPLACE FUNCTION get_user_exercise_rankings(p_user_id UUID, p_exercise_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    exercise_id UUID,
    exercise_name TEXT,
    exercise_type exercise_type,
    amount INTEGER,
    achieved_at TIMESTAMPTZ,
    workout_id UUID,
    rank_position BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH individual_sets AS (
        SELECT 
            we.exercise_id,
            e.name,
            e.type,
            w.workout_date,
            w.workout_id,
            unnest(we.reps) as performance_amount
        FROM workout_exercises we
        JOIN exercises e ON e.exercise_id = we.exercise_id
        JOIN workouts w ON w.workout_id = we.workout_id
        WHERE w.user_id = p_user_id 
            AND we.exercise_id = p_exercise_id
    ),
    ranked_performances AS (
        SELECT 
            exercise_id,
            name,
            type,
            workout_date,
            workout_id,
            performance_amount,
            ROW_NUMBER() OVER (
                ORDER BY performance_amount DESC, workout_date DESC
            ) as rank_pos
        FROM individual_sets
    )
    SELECT 
        exercise_id,
        name,
        type,
        performance_amount as amount,
        workout_date as achieved_at,
        workout_id,
        rank_pos as rank_position
    FROM ranked_performances
    WHERE rank_pos <= p_limit
    ORDER BY rank_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's exercise podium (top 3 performance tiers with all individual sets in each tier)
CREATE OR REPLACE FUNCTION get_user_exercise_podium(p_user_id UUID, p_exercise_id UUID)
RETURNS TABLE (
    exercise_id UUID,
    exercise_name TEXT,
    exercise_type exercise_type,
    amount INTEGER,
    achieved_at TIMESTAMPTZ,
    workout_id UUID,
    podium_position INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH individual_sets AS (
        SELECT 
            we.exercise_id,
            e.name,
            e.type,
            w.workout_date,
            w.workout_id,
            unnest(we.reps) as performance_amount
        FROM workout_exercises we
        JOIN exercises e ON e.exercise_id = we.exercise_id
        JOIN workouts w ON w.workout_id = we.workout_id
        WHERE w.user_id = p_user_id 
            AND we.exercise_id = p_exercise_id
    ),
    ranked_performances AS (
        SELECT 
            exercise_id,
            name,
            type,
            workout_date,
            workout_id,
            performance_amount,
            DENSE_RANK() OVER (
                ORDER BY performance_amount DESC
            ) as podium_pos
        FROM individual_sets
    )
    SELECT 
        exercise_id,
        name,
        type,
        performance_amount as amount,
        workout_date as achieved_at,
        workout_id,
        podium_pos::INTEGER as podium_position
    FROM ranked_performances
    WHERE podium_pos <= 3
    ORDER BY podium_pos, workout_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, name, profile_image_url)
  VALUES (NEW.id, NEW.email, NULL, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile images bucket
CREATE POLICY "Users can upload their own profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own profile images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'profile-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own profile images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'profile-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Profile images are publicly viewable" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');