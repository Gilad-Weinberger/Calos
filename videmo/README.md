# Demo Data Generation SQL Script

This SQL script generates realistic demo data for the Calos mobile app demo video.

## What It Creates

- **3 Fake Users** with profile images and usernames:
  - Alex Chen (alexchen@demo.com) - Elite calisthenics athlete
  - Maria Rodriguez (mariarodriguez@demo.com) - Pull-up specialist
  - Jordan Smith (jordansmith@demo.com) - Skills and static holds expert

- **24 Calisthenics Exercises** including:
  - Pull-ups, Muscle-ups, Handstand Push-ups
  - Front Lever, Tuck Planche, L-Sit
  - And many more elite bodyweight exercises

- **3 Completed Workouts** with realistic sets/reps:
  - Push Day A (completed 2 hours ago)
  - Pull Day A (completed 5 hours ago)
  - Skill & Core (completed yesterday)

## Prerequisites

1. **Supabase Project**
   - Active Supabase project
   - Access to the SQL Editor in your Supabase dashboard

2. **Database Schema**

   All tables must be created (users, exercises, workouts, workout_exercises)

## How to Run

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Paste the SQL Script

1. Open `scripts/generateDemoData.sql`
2. Copy the entire file contents
3. Paste into the SQL Editor

### Step 3: Execute

Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

## Expected Output

When you run the SQL script, you'll see NOTICE messages in the Results panel:

```
NOTICE:  🚀 Calos Demo Data Generator
NOTICE:  ============================
NOTICE:
NOTICE:  💪 Setting up exercises database...
NOTICE:     ✓ Exercises setup complete
NOTICE:
NOTICE:  📝 Creating demo users...
NOTICE:     ✓ Created user: Alex Chen
NOTICE:     ✓ Created user: Maria Rodriguez
NOTICE:     ✓ Created user: Jordan Smith
NOTICE:
NOTICE:  🏋️  Creating completed workouts...
NOTICE:     ✓ Created workout: Push Day A (Alex Chen)
NOTICE:     ✓ Created workout: Pull Day A (Maria Rodriguez)
NOTICE:     ✓ Created workout: Skill & Core (Jordan Smith)
NOTICE:
NOTICE:  ✅ Demo data generation complete!
NOTICE:
NOTICE:  📊 Summary:
NOTICE:     - Created 3 demo users
NOTICE:     - Setup 24 elite calisthenics exercises
NOTICE:     - Created 3 completed workouts
NOTICE:
NOTICE:  🎬 Your demo video data is ready!
NOTICE:
NOTICE:  👤 Demo Users:
NOTICE:     - Alex Chen (alexchen@demo.com)
NOTICE:     - Maria Rodriguez (mariarodriguez@demo.com)
NOTICE:     - Jordan Smith (jordansmith@demo.com)

Success. No rows returned
```

## Idempotency

The SQL script is idempotent, meaning you can run it multiple times safely:

- If users already exist, it will reuse them
- If exercises already exist, they will be skipped (ON CONFLICT DO NOTHING)
- New workouts will be created each time (useful for testing multiple scenarios)

## Troubleshooting

### Error: relation "users" does not exist

Make sure your database schema is fully deployed. All tables (users, exercises, workouts, workout_exercises) must exist.

### Error: permission denied

Make sure you're signed in to your Supabase dashboard with proper admin permissions.

### Users don't show up in Authentication

Note: This SQL script creates users directly in the `users` table without creating auth records. If you need full auth users, you may need to use the Supabase Admin API separately or modify the script.

## Cleanup

To remove the demo data:

### Option 1: Using SQL Editor

Run this cleanup script in the SQL Editor:

```sql
-- Delete demo users and their data
DELETE FROM users
WHERE email IN (
  'alexchen@demo.com',
  'mariarodriguez@demo.com',
  'jordansmith@demo.com'
);

-- Workouts and workout_exercises will be automatically deleted due to CASCADE constraints
```

### Option 2: Using Dashboard

1. Go to Table Editor > users
2. Find and delete the 3 demo users
3. Related workouts will cascade delete automatically

## Notes

- Profile images are sourced from Unsplash for realistic appearance
- Workout times are relative (2 hours ago, 5 hours ago, yesterday)
- All exercises use realistic rep ranges for elite calisthenics athletes
- The script does NOT create auth users (only database records)
- The script does NOT create a plan for the main demo user (create this manually in the app)
- The script does NOT setup social connections (follow/unfollow relationships)
