# Testing Instructions for Demo Data SQL Script

## Prerequisites

Before running the script, ensure you have:

1. **Supabase Project Setup**
   - Active Supabase project
   - Access to Supabase Dashboard
   - Database schema deployed (all tables created)

2. **Database Schema Required**
   - `users` table
   - `exercises` table
   - `workouts` table
   - `workout_exercises` table

## Running the Script

### Step 1: Access SQL Editor

1. Log in to your Supabase Dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **New Query**

### Step 2: Execute the Script

1. Open `scripts/generateDemoData.sql` in your code editor
2. Copy the entire SQL script
3. Paste into the SQL Editor
4. Click **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 3: Review Output

Check the Results panel for NOTICE messages confirming successful data creation

## Verification Checklist

After running the script, verify the following in your Supabase dashboard:

### 1. Check Users Created

**Go to: Table Editor > users**

You should see 3 new users:

- ✅ alexchen@demo.com
- ✅ mariarodriguez@demo.com
- ✅ jordansmith@demo.com

### 2. Check User Profile Data

**In the same Table Editor > users view:**

Verify each user has:

- ✅ `name` field populated (Alex Chen, Maria Rodriguez, Jordan Smith)
- ✅ `username` field populated (alexchen, mariarodriguez, jordansmith)
- ✅ `profile_image_url` field populated with Unsplash URL
- ✅ Unique `user_id` (UUID format)

### 3. Check Exercises Created

**Go to: Table Editor > exercises**

You should see at least 24 calisthenics exercises:

- ✅ Pull-ups, Chin-ups, Muscle-ups
- ✅ Dips, Pike Push-ups, Handstand Push-ups
- ✅ L-Sit, Plank, Front Lever Hold
- ✅ And 15+ more exercises

### 4. Check Workouts Created

**Go to: Table Editor > workouts**

You should see 3 completed workouts:

- ✅ "Push Day A" for Alex Chen (done: true, ~2 hours ago)
- ✅ "Pull Day A" for Maria Rodriguez (done: true, ~5 hours ago)
- ✅ "Skill & Core" for Jordan Smith (done: true, ~24 hours ago)

### 5. Check Workout Exercises

**Go to: Table Editor > workout_exercises**

You should see:

- ✅ 8 exercises for "Push Day A"
- ✅ 8 exercises for "Pull Day A"
- ✅ 6 exercises for "Skill & Core"
- ✅ Each with realistic reps arrays (e.g., [10, 9, 8, 8])

### 6. Test in Mobile App

**Final verification:**

1.  Open your Calos app
2.  Sign in with your main demo user account
3.  Go to the Home tab
4.  ✅ You should see the 3 completed workouts in your feed
5.  ✅ Each workout should show user profile images
6.  ✅ Each workout should show exercise details

## Expected Script Output

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

Success. No rows returned
```

## Troubleshooting

### Issue: "relation does not exist"

- **Solution**: Ensure your database schema is fully deployed (all tables created)
- Check that you have users, exercises, workouts, and workout_exercises tables

### Issue: "permission denied"

- **Solution**: Verify you're logged in to Supabase with proper admin permissions
- Check your RLS (Row Level Security) policies if enabled

### Issue: "duplicate key value violates unique constraint"

- **Solution**: Demo users already exist. Either:
  - Delete existing demo users first, or
  - The script will skip creation and reuse existing users

### Issue: Workouts not showing in app

- **Solution**:
  1. Check if workouts are marked as `done: true`
  2. Verify user is following the demo users (if social features are enabled)
  3. Check timestamps are recent (within last 24 hours)

## Running Multiple Times

The SQL script is **idempotent** for users and exercises:

- **Users**: Will reuse existing users if found (checks by email)
- **Exercises**: Uses `ON CONFLICT DO NOTHING` to skip duplicates
- **Workouts**: Will create new workouts each time (useful for testing)

## Cleanup

To remove demo data, run this in SQL Editor:

```sql
-- Delete demo users and their data
DELETE FROM users
WHERE email IN (
  'alexchen@demo.com',
  'mariarodriguez@demo.com',
  'jordansmith@demo.com'
);

-- Workouts and workout_exercises cascade delete automatically
```

Or use Table Editor:

1. **Delete Users**: Go to Table Editor > users, delete demo users
2. **Cascading**: Workouts and workout_exercises will be auto-deleted
3. **Exercises**: Can be left in the database for future use

## Next Steps

After successful testing:

1. ✅ Verify all data in Supabase dashboard
2. ✅ Test social feed in mobile app
3. ✅ Record demo video with populated data
4. 🎬 Create amazing demo video!
