-- Migration: Add missing INSERT policy for users table
-- This allows the database trigger to automatically create user profiles
-- when new users sign up through Supabase Auth

-- Add INSERT policy for users table to allow trigger function to create user profiles
CREATE POLICY "Users can be created by trigger" ON users
    FOR INSERT WITH CHECK (user_id = auth.uid());
