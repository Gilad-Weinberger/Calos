-- Migration: Add notification preferences to users table
-- This migration adds notification settings to the users table

-- Add notification preference columns to users table
ALTER TABLE users ADD COLUMN push_notifications_enabled BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE users ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true NOT NULL;

-- Create indexes for performance
CREATE INDEX idx_users_push_notifications ON users(push_notifications_enabled);
CREATE INDEX idx_users_email_notifications ON users(email_notifications_enabled);

-- Update existing users to have notifications enabled by default
UPDATE users 
SET 
  push_notifications_enabled = true,
  email_notifications_enabled = true
WHERE push_notifications_enabled IS NULL OR email_notifications_enabled IS NULL;
