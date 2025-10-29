-- Migration: Add workout media, title, description, and visibility
-- This migration adds support for workout media uploads, custom titles, descriptions, and visibility settings

-- Add new columns to workouts table
ALTER TABLE workouts 
ADD COLUMN media_urls TEXT[] DEFAULT '{}',
ADD COLUMN title TEXT,
ADD COLUMN description TEXT,
ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private'));

-- Create storage bucket for workout media (photos and videos)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workout-media', 'workout-media', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for workout-media bucket
CREATE POLICY "Users can upload their own workout media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'workout-media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own workout media" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'workout-media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own workout media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'workout-media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own workout media
CREATE POLICY "Users can view their own workout media" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'workout-media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view public workout media (for public workouts)
CREATE POLICY "Public workout media is viewable" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'workout-media' 
        AND EXISTS (
            SELECT 1 FROM workouts w 
            WHERE w.media_urls @> ARRAY[storage.objects.name]
            AND w.visibility = 'public'
        )
    );

-- Users can view follower workout media (for follower workouts)
CREATE POLICY "Follower workout media is viewable to followers" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'workout-media' 
        AND EXISTS (
            SELECT 1 FROM workouts w 
            WHERE w.media_urls @> ARRAY[storage.objects.name]
            AND w.visibility = 'followers'
            AND w.user_id = auth.uid()
        )
    );

-- Update workouts SELECT policy to respect visibility
DROP POLICY IF EXISTS "Users can read their own workouts" ON workouts;

CREATE POLICY "Users can read their own workouts" ON workouts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Public workouts are visible to everyone" ON workouts
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "Follower workouts are visible to followers" ON workouts
    FOR SELECT USING (
        visibility = 'followers' 
        AND user_id = auth.uid()
    );

-- Create index for visibility queries
CREATE INDEX idx_workouts_visibility ON workouts(visibility);
CREATE INDEX idx_workouts_user_visibility ON workouts(user_id, visibility);
