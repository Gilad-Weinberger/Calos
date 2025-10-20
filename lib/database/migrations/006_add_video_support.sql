-- Migration: Add video support to workout exercises
-- This migration adds video URLs and analysis metadata to workout exercises

-- Add video_urls column to workout_exercises table
ALTER TABLE workout_exercises 
ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

-- Add analysis_metadata column to store Gemini analysis details
ALTER TABLE workout_exercises 
ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}';

-- Add comment to explain the columns
COMMENT ON COLUMN workout_exercises.video_urls IS 'Array of video URLs stored in Supabase Storage';
COMMENT ON COLUMN workout_exercises.analysis_metadata IS 'JSON metadata from Gemini AI analysis including confidence scores and detected exercise details';

-- Create storage bucket for workout videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workout-videos', 'workout-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for workout-videos bucket
-- Users can upload videos to their own folder
CREATE POLICY "Users can upload their own workout videos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'workout-videos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own workout videos
CREATE POLICY "Users can update their own workout videos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'workout-videos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own workout videos
CREATE POLICY "Users can delete their own workout videos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'workout-videos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can only view their own workout videos (not public)
CREATE POLICY "Users can view their own workout videos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'workout-videos' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

