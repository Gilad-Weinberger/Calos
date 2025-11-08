-- Migration: Weekly Workout Generation Cron Job
-- This migration sets up a cron job to automatically create future workouts for active recurring plans
-- Runs every Sunday at 12:00 PM UTC

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- STEP 1: Get your service role key from Supabase Dashboard > Settings > API
-- Copy the "service_role" key (starts with eyJ...)

-- STEP 2: Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY_HERE below with your actual values, then run this:
CREATE OR REPLACE FUNCTION trigger_create_future_plan_workouts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url text;
  http_response record;
BEGIN
  edge_function_url := 'https://dwkguunfgrxfeuhzsyhm.supabase.co/functions/v1/create-future-plan-workouts';

  -- Call edge function WITHOUT Authorization
  SELECT * INTO http_response FROM http(
    (
      'POST',
      edge_function_url,
      ARRAY[http_header('Content-Type', 'application/json')],
      'application/json',
      '{}'
    )
  );

  RAISE LOG 'Create future plan workouts cron job executed successfully at %. Status: %', NOW()::text, http_response.status;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Create future plan workouts cron job failed: %', SQLERRM;
END;
$$;


-- Create the cron job to run every Sunday at 12:00 PM UTC
-- Cron format: minute hour day-of-month month day-of-week
-- 0 = Sunday, so '0 12 * * 0' means: minute 0, hour 12, any day of month, any month, Sunday
SELECT cron.schedule(
  'create-future-plan-workouts-weekly',
  '0 12 * * 0', -- Every Sunday at 12:00 PM UTC
  $$SELECT trigger_create_future_plan_workouts();$$
);

-- =====================================================
-- QUICK SETUP GUIDE:
-- =====================================================
-- 1. Enable extensions: pg_cron and http (Dashboard > Database > Extensions)
-- 2. Get your service role key (Dashboard > Settings > API)
-- 3. Get your project reference (from your Supabase URL or Dashboard)
-- 4. Replace 'YOUR_PROJECT_REF' on line 26 with your actual project reference
-- 5. Replace 'YOUR_SERVICE_ROLE_KEY_HERE' on line 29 with your actual service role key
-- 6. Run the CREATE OR REPLACE FUNCTION above
-- 7. Run the SELECT cron.schedule() above
-- 8. Test: SELECT trigger_create_future_plan_workouts();

-- =====================================================
-- MANAGEMENT COMMANDS:
-- =====================================================
-- View existing cron jobs: SELECT * FROM cron.job;
-- View cron job details: SELECT * FROM cron.job WHERE jobname = 'create-future-plan-workouts-weekly';
-- Remove cron job: SELECT cron.unschedule('create-future-plan-workouts-weekly');
-- Test manually: SELECT trigger_create_future_plan_workouts();
-- Update existing cron job: First unschedule, then schedule again with new schedule

-- =====================================================
-- NOTES:
-- =====================================================
-- - The cron job runs every Sunday at 12:00 PM UTC
-- - The edge function handles creating workouts for all active recurring plans
-- - Check edge function logs in Supabase Dashboard > Edge Functions > Logs for execution details

