# Create Future Plan Workouts Edge Function

This Supabase Edge Function automatically creates future workouts for all active recurring plans. It is triggered weekly via a pg_cron job every Sunday at 12:00 PM UTC.

## Overview

This function replaces the previous screen-based trigger system. Instead of creating workouts when users navigate to certain screens, workouts are now created automatically on a weekly schedule.

## Setup

### 1. Deploy the Edge Function

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy create-future-plan-workouts
```

### 2. Run the Migration

Apply the migration file to your database:

```bash
# Using Supabase CLI
supabase db push

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Run the contents of lib/database/migrations/016_weekly_workout_cron.sql
```

### 3. Configure Database Function

The database function needs your Supabase project reference and service role key. Edit the migration file before running it:

1. Open `lib/database/migrations/016_weekly_workout_cron.sql`
2. Replace `YOUR_PROJECT_REF` with your actual Supabase project reference (line 25)
3. Replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key (line 28)
4. Get your service role key from: Supabase Dashboard > Settings > API > service_role key (starts with `eyJ...`)

**Important**: 
- The service role key is sensitive. Never commit it to version control.
- The values are hardcoded in the database function (not using vault).
- After updating the values, run the `CREATE OR REPLACE FUNCTION` statement from the migration file.

### 4. Verify Cron Job

Check that the cron job was created successfully:

```sql
SELECT * FROM cron.job WHERE jobname = 'create-future-plan-workouts-weekly';
```

## How It Works

1. **Cron Job**: Runs every Sunday at 12:00 PM UTC
2. **Database Function**: `trigger_create_future_plan_workouts()` calls the edge function via HTTP
3. **Edge Function**:
   - Queries all active recurring plans (`plan_type = 'repeat' AND is_active = true`)
   - For each plan, checks if current week has workouts
   - If yes, creates workouts for the next week
   - Handles exercise mapping and workout creation

## Manual Testing

You can manually trigger the function for testing:

```sql
-- Test the database function
SELECT trigger_create_future_plan_workouts();

-- Or call the edge function directly (requires service role key)
curl -X POST https://your-project-ref.supabase.co/functions/v1/create-future-plan-workouts \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Monitoring

- Check edge function logs in Supabase Dashboard > Edge Functions > create-future-plan-workouts
- Check cron job execution: `SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'create-future-plan-workouts-weekly');`

## Troubleshooting

### Cron Job Not Running

1. Verify pg_cron extension is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Check cron job exists: `SELECT * FROM cron.job WHERE jobname = 'create-future-plan-workouts-weekly';`
3. Check for errors: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

### Edge Function Returns Errors

- Verify service role key is correctly set in the database function
- Check that the Authorization header includes "Bearer " prefix
- Ensure the service role key matches your Supabase project
- Verify the project reference in the edge function URL is correct
- Make sure you've replaced the placeholder values in the function before running it

### No Workouts Created

- Verify there are active recurring plans: `SELECT * FROM plans WHERE plan_type = 'repeat' AND is_active = true;`
- Check edge function logs for errors
- Verify current week has workouts (function only creates next week if current week exists)

## Unschedule Cron Job

To stop the automatic weekly execution:

```sql
SELECT cron.unschedule('create-future-plan-workouts-weekly');
```

## Security

- The edge function is called with service role key authentication via the database function
- Only active recurring plans are processed
- All database operations use the service role key for proper permissions
- The service role key is stored in the database function (ensure proper access controls)
- Never commit service role keys or other secrets to version control
- The function uses `SECURITY DEFINER` to run with elevated privileges
