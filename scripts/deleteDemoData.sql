-- ============================================================================
-- Delete Demo Data Script for Calos Mobile Demo Video
-- ============================================================================
-- This SQL script removes all demo data created by generateDemoData.sql
--
-- Usage: Copy and paste this entire script into the Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
  alex_user_id UUID;
  maria_user_id UUID;
  jordan_user_id UUID;
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '🗑️  Calos Demo Data Cleanup';
  RAISE NOTICE '============================';
  RAISE NOTICE '';
  
  -- ============================================================================
  -- Get Demo User IDs
  -- ============================================================================
  RAISE NOTICE '🔍 Finding demo users...';
  
  SELECT user_id INTO alex_user_id FROM users WHERE email = 'alexchen@demo.com';
  SELECT user_id INTO maria_user_id FROM users WHERE email = 'mariarodriguez@demo.com';
  SELECT user_id INTO jordan_user_id FROM users WHERE email = 'jordansmith@demo.com';
  
  IF alex_user_id IS NULL AND maria_user_id IS NULL AND jordan_user_id IS NULL THEN
    RAISE NOTICE '   ℹ️  No demo users found. Nothing to delete.';
    RETURN;
  END IF;
  
  IF alex_user_id IS NOT NULL THEN
    RAISE NOTICE '   ✓ Found Alex Chen: %', alex_user_id;
  END IF;
  
  IF maria_user_id IS NOT NULL THEN
    RAISE NOTICE '   ✓ Found Maria Rodriguez: %', maria_user_id;
  END IF;
  
  IF jordan_user_id IS NOT NULL THEN
    RAISE NOTICE '   ✓ Found Jordan Smith: %', jordan_user_id;
  END IF;
  
  -- ============================================================================
  -- Delete Workouts (CASCADE will delete workout_exercises)
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '🏋️  Deleting demo workouts...';
  
  deleted_count := 0;
  
  IF alex_user_id IS NOT NULL THEN
    DELETE FROM workouts WHERE user_id = alex_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✓ Deleted % workouts for Alex Chen', deleted_count;
  END IF;
  
  IF maria_user_id IS NOT NULL THEN
    DELETE FROM workouts WHERE user_id = maria_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✓ Deleted % workouts for Maria Rodriguez', deleted_count;
  END IF;
  
  IF jordan_user_id IS NOT NULL THEN
    DELETE FROM workouts WHERE user_id = jordan_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '   ✓ Deleted % workouts for Jordan Smith', deleted_count;
  END IF;
  
  -- ============================================================================
  -- Delete Demo Users
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '👤 Deleting demo users...';
  
  IF alex_user_id IS NOT NULL THEN
    DELETE FROM users WHERE user_id = alex_user_id;
    RAISE NOTICE '   ✓ Deleted user: Alex Chen';
  END IF;
  
  IF maria_user_id IS NOT NULL THEN
    DELETE FROM users WHERE user_id = maria_user_id;
    RAISE NOTICE '   ✓ Deleted user: Maria Rodriguez';
  END IF;
  
  IF jordan_user_id IS NOT NULL THEN
    DELETE FROM users WHERE user_id = jordan_user_id;
    RAISE NOTICE '   ✓ Deleted user: Jordan Smith';
  END IF;
  
  -- ============================================================================
  -- Optional: Clean up demo exercises (commented out by default)
  -- ============================================================================
  -- Uncomment the following section if you want to delete the demo exercises as well
  -- Note: This will only delete exercises that are not used by any other workouts
  
  /*
  RAISE NOTICE '';
  RAISE NOTICE '💪 Cleaning up unused demo exercises...';
  
  DELETE FROM exercises
  WHERE name IN (
    'Pull-ups', 'Chin-ups', 'Muscle-ups', 'Dips', 'Pike Push-ups',
    'Handstand Push-ups', 'Pseudo Planche Push-ups', 'Archer Push-ups',
    'Diamond Push-ups', 'Pistol Squats', 'Nordic Curls', 'Australian Pull-ups',
    'Typewriter Pull-ups', 'Archer Pull-ups', 'L-Sit', 'Plank',
    'Front Lever Hold', 'Back Lever Hold', 'Handstand Hold', 'Dragon Flags',
    'Tuck Planche', 'Hollow Body Hold', 'Front Lever Rows', 'Tricep Dips'
  )
  AND exercise_id NOT IN (
    SELECT DISTINCT exercise_id FROM workout_exercises
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '   ✓ Deleted % unused exercises', deleted_count;
  */
  
  -- ============================================================================
  -- Summary
  -- ============================================================================
  RAISE NOTICE '';
  RAISE NOTICE '✅ Demo data cleanup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '   - Deleted demo users and their workouts';
  RAISE NOTICE '   - Workout exercises automatically deleted (CASCADE)';
  RAISE NOTICE '';
  RAISE NOTICE '🎬 Demo data has been removed!';
  
END $$;

