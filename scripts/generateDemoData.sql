-- ============================================================================
-- Demo Data Generation Script for Calos Mobile Demo Video
-- ============================================================================
-- This SQL script creates fake users with completed workouts to populate
-- the social feed for the demo video.
--
-- Usage: Copy and paste this entire script into the Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
  -- User IDs
  alex_user_id UUID;
  maria_user_id UUID;
  jordan_user_id UUID;
  
  -- Workout IDs
  alex_workout_id UUID;
  maria_workout_id UUID;
  jordan_workout_id UUID;
  
  -- Exercise IDs
  exercise_ids JSONB := '{}'::jsonb;
  
  -- Timestamps
  now_time TIMESTAMP := NOW();
  alex_workout_time TIMESTAMP;
  maria_workout_time TIMESTAMP;
  jordan_workout_time TIMESTAMP;
BEGIN
  RAISE NOTICE '🚀 Calos Demo Data Generator';
  RAISE NOTICE '============================';
  
  -- ============================================================================
  -- STEP 1: Create Elite Calisthenics Exercises
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '💪 Setting up exercises database...';
  
  -- Insert exercises only if they don't already exist
  INSERT INTO exercises (name, type)
  SELECT 'Pull-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pull-ups')
  UNION ALL
  SELECT 'Chin-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chin-ups')
  UNION ALL
  SELECT 'Muscle-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Muscle-ups')
  UNION ALL
  SELECT 'Dips', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dips')
  UNION ALL
  SELECT 'Pike Push-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pike Push-ups')
  UNION ALL
  SELECT 'Handstand Push-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Handstand Push-ups')
  UNION ALL
  SELECT 'Pseudo Planche Push-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pseudo Planche Push-ups')
  UNION ALL
  SELECT 'Archer Push-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Archer Push-ups')
  UNION ALL
  SELECT 'Diamond Push-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Diamond Push-ups')
  UNION ALL
  SELECT 'Pistol Squats', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pistol Squats')
  UNION ALL
  SELECT 'Nordic Curls', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Nordic Curls')
  UNION ALL
  SELECT 'Australian Pull-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Australian Pull-ups')
  UNION ALL
  SELECT 'Typewriter Pull-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Typewriter Pull-ups')
  UNION ALL
  SELECT 'Archer Pull-ups', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Archer Pull-ups')
  UNION ALL
  SELECT 'L-Sit', 'static'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'L-Sit')
  UNION ALL
  SELECT 'Plank', 'static'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Plank')
  UNION ALL
  SELECT 'Front Lever Hold', 'static'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Front Lever Hold')
  UNION ALL
  SELECT 'Back Lever Hold', 'static'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Back Lever Hold')
  UNION ALL
  SELECT 'Handstand Hold', 'static'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Handstand Hold')
  UNION ALL
  SELECT 'Dragon Flags', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dragon Flags')
  UNION ALL
  SELECT 'Tuck Planche', 'static'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Tuck Planche')
  UNION ALL
  SELECT 'Hollow Body Hold', 'static'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hollow Body Hold')
  UNION ALL
  SELECT 'Front Lever Rows', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Front Lever Rows')
  UNION ALL
  SELECT 'Tricep Dips', 'dynamic'::exercise_type
  WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Tricep Dips');
  
  RAISE NOTICE '   ✓ Exercises setup complete';
  
  -- Build exercise ID map for easy lookup
  SELECT jsonb_object_agg(name, exercise_id)
  INTO exercise_ids
  FROM exercises;
  
  -- ============================================================================
  -- STEP 2: Create Demo Users with Auth
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '📝 Creating demo users...';
  
  -- First, add description column to users if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'description'
  ) THEN
    ALTER TABLE users ADD COLUMN description TEXT;
    RAISE NOTICE '   ✓ Added description column to users table';
  END IF;
  
  -- Add media_urls column to workouts if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workouts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE workouts ADD COLUMN media_urls TEXT[] DEFAULT '{}';
    RAISE NOTICE '   ✓ Added media_urls column to workouts table';
  END IF;
  
  -- Check if users already exist, if not create them
  SELECT user_id INTO alex_user_id FROM users WHERE email = 'alexchen@demo.com';
  IF alex_user_id IS NULL THEN
    -- Generate UUID for Alex
    alex_user_id := gen_random_uuid();
    
    -- Insert into users table
    -- Alex Chen: Elite calisthenics athlete specializing in push movements
    INSERT INTO users (user_id, email, name, profile_image_url, description)
    VALUES (
      alex_user_id,
      'alexchen@demo.com',
      'Alex Chen',
      'https://images.unsplash.com/photo-1567401893912-09b700c7f4bd?w=400&h=400&fit=crop',
      'Push specialist | Handstand push-up enthusiast | Training for planche'
    );
    RAISE NOTICE '   ✓ Created user: Alex Chen';
  ELSE
    RAISE NOTICE '   ✓ User already exists: Alex Chen';
  END IF;
  
  SELECT user_id INTO maria_user_id FROM users WHERE email = 'mariarodriguez@demo.com';
  IF maria_user_id IS NULL THEN
    maria_user_id := gen_random_uuid();
    
    -- Maria Rodriguez: Pull specialist with strong muscle-up game
    INSERT INTO users (user_id, email, name, profile_image_url, description)
    VALUES (
      maria_user_id,
      'mariarodriguez@demo.com',
      'Maria Rodriguez',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
      'Pull-up queen 👑 | Muscle-up addict | Chasing the one-arm pull-up'
    );
    RAISE NOTICE '   ✓ Created user: Maria Rodriguez';
  ELSE
    RAISE NOTICE '   ✓ User already exists: Maria Rodriguez';
  END IF;
  
  SELECT user_id INTO jordan_user_id FROM users WHERE email = 'jordansmith@demo.com';
  IF jordan_user_id IS NULL THEN
    jordan_user_id := gen_random_uuid();
    
    -- Jordan Smith: Skills and static holds expert
    INSERT INTO users (user_id, email, name, profile_image_url, description)
    VALUES (
      jordan_user_id,
      'jordansmith@demo.com',
      'Jordan Smith',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
      'Static holds master | Front lever & planche progression | Balance is key 🧘'
    );
    RAISE NOTICE '   ✓ Created user: Jordan Smith';
  ELSE
    RAISE NOTICE '   ✓ User already exists: Jordan Smith';
  END IF;

  -- ============================================================================
  -- STEP 2.5: Clean Up Existing Demo Workouts
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '🧹 Cleaning up existing demo workouts...';
  
  -- Delete existing workouts for demo users (cascades to workout_exercises)
  DELETE FROM workouts WHERE user_id IN (alex_user_id, maria_user_id, jordan_user_id) AND done = true;
  
  RAISE NOTICE '   ✓ Deleted existing completed workouts for demo users';
  
  -- ============================================================================
  -- STEP 3: Create Completed Workouts
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '🏋️  Creating completed workouts...';
  
  -- Calculate workout times
  alex_workout_time := now_time - INTERVAL '2 hours';
  maria_workout_time := now_time - INTERVAL '5 hours';
  jordan_workout_time := now_time - INTERVAL '24 hours';
  
  -- ----------------------------------------------------------------------------
  -- Alex Chen - Push Day A (2 hours ago) - Male
  -- ----------------------------------------------------------------------------
  INSERT INTO workouts (
    user_id,
    workout_date,
    start_time,
    end_time,
    title,
    description,
    done,
    plan_id,
    plan_workout_letter,
    scheduled_date,
    media_urls
  )
  VALUES (
    alex_user_id,
    alex_workout_time,
    alex_workout_time - INTERVAL '1 hour 17 minutes',
    alex_workout_time,
    'Push Day A',
    'Solid push session today! 💪 Hit 7 reps on handstand push-ups. Shoulder and tricep pump was insane!',
    true,
    NULL,
    NULL,
    NULL,
    ARRAY[
      'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=1000&fit=crop'
    ]
  )
  RETURNING workout_id INTO alex_workout_id;
  
  -- Insert Alex's workout exercises
  INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index, rest_seconds)
  VALUES
    (alex_workout_id, (exercise_ids->>'Handstand Push-ups')::uuid, 4, ARRAY[6, 7, 6, 5], 0, 90),
    (alex_workout_id, (exercise_ids->>'Pike Push-ups')::uuid, 3, ARRAY[10, 9, 8], 1, 90),
    (alex_workout_id, (exercise_ids->>'Dips')::uuid, 4, ARRAY[12, 11, 10, 9], 2, 90),
    (alex_workout_id, (exercise_ids->>'Pseudo Planche Push-ups')::uuid, 3, ARRAY[8, 7, 6], 3, 90),
    (alex_workout_id, (exercise_ids->>'Archer Push-ups')::uuid, 3, ARRAY[8, 7, 7], 4, 90),
    (alex_workout_id, (exercise_ids->>'Diamond Push-ups')::uuid, 3, ARRAY[15, 14, 12], 5, 90),
    (alex_workout_id, (exercise_ids->>'Tricep Dips')::uuid, 3, ARRAY[12, 11, 10], 6, 90),
    (alex_workout_id, (exercise_ids->>'Plank')::uuid, 3, ARRAY[60, 60, 55], 7, 90);
  
  RAISE NOTICE '   ✓ Created workout: Push Day A (Alex Chen)';
  
  -- ----------------------------------------------------------------------------
  -- Maria Rodriguez - Pull Day A (5 hours ago) - Female
  -- ----------------------------------------------------------------------------
  INSERT INTO workouts (
    user_id,
    workout_date,
    start_time,
    end_time,
    title,
    description,
    done,
    plan_id,
    plan_workout_letter,
    scheduled_date,
    media_urls
  )
  VALUES (
    maria_user_id,
    maria_workout_time,
    maria_workout_time - INTERVAL '49 minutes',
    maria_workout_time,
    'Pull Day A',
    'Pull day complete! 👑 10 reps on pull-ups felt great. Muscle-ups are getting so much cleaner now!',
    true,
    NULL,
    NULL,
    NULL,
    ARRAY[
      'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&h=1000&fit=crop'
    ]
  )
  RETURNING workout_id INTO maria_workout_id;
  
  -- Insert Maria's workout exercises
  INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index, rest_seconds)
  VALUES
    (maria_workout_id, (exercise_ids->>'Pull-ups')::uuid, 4, ARRAY[10, 9, 8, 8], 0, 90),
    (maria_workout_id, (exercise_ids->>'Chin-ups')::uuid, 3, ARRAY[12, 11, 10], 1, 90),
    (maria_workout_id, (exercise_ids->>'Muscle-ups')::uuid, 3, ARRAY[4, 3, 3], 2, 90),
    (maria_workout_id, (exercise_ids->>'Archer Pull-ups')::uuid, 3, ARRAY[6, 5, 5], 3, 90),
    (maria_workout_id, (exercise_ids->>'Australian Pull-ups')::uuid, 3, ARRAY[15, 14, 13], 4, 90),
    (maria_workout_id, (exercise_ids->>'Typewriter Pull-ups')::uuid, 3, ARRAY[8, 7, 6], 5, 90),
    (maria_workout_id, (exercise_ids->>'Nordic Curls')::uuid, 3, ARRAY[6, 5, 5], 6, 90),
    (maria_workout_id, (exercise_ids->>'L-Sit')::uuid, 3, ARRAY[25, 20, 20], 7, 90);
  
  RAISE NOTICE '   ✓ Created workout: Pull Day A (Maria Rodriguez)';
  
  -- ----------------------------------------------------------------------------
  -- Jordan Smith - Skill & Core (yesterday) - Male
  -- ----------------------------------------------------------------------------
  INSERT INTO workouts (
    user_id,
    workout_date,
    start_time,
    end_time,
    title,
    description,
    done,
    plan_id,
    plan_workout_letter,
    scheduled_date,
    media_urls
  )
  VALUES (
    jordan_user_id,
    jordan_workout_time,
    jordan_workout_time - INTERVAL '58 minutes',
    jordan_workout_time,
    'Skill & Core',
    'Skills and core today! 🔥 50 second handstand - new PR. Front lever hold feeling solid 🧘',
    true,
    NULL,
    NULL,
    NULL,
    ARRAY[
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop'
    ]
  )
  RETURNING workout_id INTO jordan_workout_id;
  
  -- Insert Jordan's workout exercises
  INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index, rest_seconds)
  VALUES
    (jordan_workout_id, (exercise_ids->>'Handstand Hold')::uuid, 5, ARRAY[45, 50, 40, 35, 30], 0, 90),
    (jordan_workout_id, (exercise_ids->>'Front Lever Hold')::uuid, 5, ARRAY[15, 12, 10, 10, 8], 1, 90),
    (jordan_workout_id, (exercise_ids->>'Tuck Planche')::uuid, 4, ARRAY[20, 18, 15, 12], 2, 90),
    (jordan_workout_id, (exercise_ids->>'L-Sit')::uuid, 4, ARRAY[30, 28, 25, 20], 3, 90),
    (jordan_workout_id, (exercise_ids->>'Dragon Flags')::uuid, 3, ARRAY[10, 9, 8], 4, 90),
    (jordan_workout_id, (exercise_ids->>'Hollow Body Hold')::uuid, 3, ARRAY[50, 45, 40], 5, 90);
  
  RAISE NOTICE '   ✓ Created workout: Skill & Core (Jordan Smith)';
  
  -- ============================================================================
  -- Summary
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '✅ Demo data generation complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   - Created 3 demo users';
  RAISE NOTICE '   - Setup 24 elite calisthenics exercises';
  RAISE NOTICE '   - Created 3 completed workouts';
  RAISE NOTICE '';
  RAISE NOTICE '🎬 Your demo video data is ready!';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Demo Users:';
  RAISE NOTICE '   - Alex Chen (alexchen@demo.com)';
  RAISE NOTICE '   - Maria Rodriguez (mariarodriguez@demo.com)';
  RAISE NOTICE '   - Jordan Smith (jordansmith@demo.com)';
  
END $$;

