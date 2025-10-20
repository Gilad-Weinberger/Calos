-- Migration: Workout Plans System
-- Description: Add plans table and update workouts table for plan-based training

-- Create plans table
CREATE TABLE plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('repeat', 'once')),
    num_weeks INTEGER DEFAULT 2 NOT NULL CHECK (num_weeks > 0),
    workouts JSONB NOT NULL,
    schedule JSONB NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for plans table
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_plans_user_active ON plans(user_id, is_active);
CREATE INDEX idx_plans_start_date ON plans(start_date);

-- Create unique partial index to ensure only one active plan per user
CREATE UNIQUE INDEX idx_plans_user_active_unique 
    ON plans(user_id, is_active) 
    WHERE is_active = true;

-- Add trigger for updated_at on plans table
CREATE TRIGGER trigger_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on plans table
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for plans table
CREATE POLICY "Users can read their own plans" ON plans
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own plans" ON plans
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own plans" ON plans
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own plans" ON plans
    FOR DELETE USING (user_id = auth.uid());

-- Add columns to workouts table for plan tracking
ALTER TABLE workouts 
    ADD COLUMN plan_id UUID REFERENCES plans(plan_id) ON DELETE SET NULL,
    ADD COLUMN plan_workout_letter TEXT,
    ADD COLUMN scheduled_date TIMESTAMPTZ,
    ADD COLUMN start_time TIMESTAMPTZ,
    ADD COLUMN end_time TIMESTAMPTZ;

-- Create indexes for new workout columns
CREATE INDEX idx_workouts_plan ON workouts(plan_id);
CREATE INDEX idx_workouts_scheduled_date ON workouts(scheduled_date);
CREATE INDEX idx_workouts_plan_scheduled ON workouts(plan_id, scheduled_date);

-- Create storage bucket for workout plan PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workout-plans', 'workout-plans', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for workout-plans bucket
CREATE POLICY "Users can upload their own workout plans" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'workout-plans' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own workout plans" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'workout-plans' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own workout plans" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'workout-plans' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own workout plans" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'workout-plans' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow service role to access all files in workout-plans (for edge function PDF analysis)
CREATE POLICY "Service role can access workout plans" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'workout-plans'
        AND auth.role() = 'service_role'
    );

