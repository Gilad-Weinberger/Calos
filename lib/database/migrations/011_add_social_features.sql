-- Migration: Add social features (username, followers, following, privacy)
-- This migration adds social functionality to the users table

-- 1. Add columns to users table
ALTER TABLE users ADD COLUMN username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN followers UUID[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN following UUID[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN is_public BOOLEAN DEFAULT true NOT NULL;

-- 2. Create indexes for performance
CREATE INDEX idx_users_followers ON users USING GIN (followers);
CREATE INDEX idx_users_following ON users USING GIN (following);
CREATE INDEX idx_users_is_public ON users(is_public);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_username_lower ON users(LOWER(username));
CREATE INDEX idx_users_name_lower ON users(LOWER(name));

-- 3. Drop old restrictive RLS policies on users table
DROP POLICY IF EXISTS "Users can read their own profile" ON users;

-- 4. Create new RLS policies on users table
-- Users can always read their own profile
CREATE POLICY "Users can read their own profile" ON users
    FOR SELECT USING (user_id = auth.uid());

-- Users can read public profiles
CREATE POLICY "Users can read public profiles" ON users
    FOR SELECT USING (is_public = true);

-- Users can read profiles they follow
CREATE POLICY "Users can read followed profiles" ON users
    FOR SELECT USING (auth.uid() = ANY(followers));

-- 5. Update RLS policies on workouts table
DROP POLICY IF EXISTS "Users can read their own workouts" ON workouts;

-- Users can read their own workouts
CREATE POLICY "Users can read their own workouts" ON workouts
    FOR SELECT USING (user_id = auth.uid());

-- Users can read workouts from public profiles
CREATE POLICY "Users can read public workouts" ON workouts
    FOR SELECT USING (
        user_id IN (
            SELECT user_id FROM users WHERE is_public = true
        )
    );

-- Users can read workouts from followed users
CREATE POLICY "Users can read followed workouts" ON workouts
    FOR SELECT USING (
        user_id IN (
            SELECT user_id FROM users WHERE auth.uid() = ANY(followers)
        )
    );

-- 6. Update RLS policies on workout_exercises table
DROP POLICY IF EXISTS "Users can read exercises from their own workouts" ON workout_exercises;

-- Users can read exercises from their own workouts
CREATE POLICY "Users can read exercises from their own workouts" ON workout_exercises
    FOR SELECT USING (
        workout_id IN (
            SELECT workout_id FROM workouts WHERE user_id = auth.uid()
        )
    );

-- Users can read exercises from public workouts
CREATE POLICY "Users can read exercises from public workouts" ON workout_exercises
    FOR SELECT USING (
        workout_id IN (
            SELECT w.workout_id FROM workouts w
            JOIN users u ON u.user_id = w.user_id
            WHERE u.is_public = true
        )
    );

-- Users can read exercises from followed users' workouts
CREATE POLICY "Users can read exercises from followed workouts" ON workout_exercises
    FOR SELECT USING (
        workout_id IN (
            SELECT w.workout_id FROM workouts w
            JOIN users u ON u.user_id = w.user_id
            WHERE auth.uid() = ANY(u.followers)
        )
    );

-- 7. Create follow_user function
CREATE OR REPLACE FUNCTION follow_user(follower_id UUID, followee_id UUID)
RETURNS void AS $$
BEGIN
    -- Add followee to follower's following list
    UPDATE users
    SET following = array_append(following, followee_id)
    WHERE user_id = follower_id
    AND NOT (followee_id = ANY(following));
    
    -- Add follower to followee's followers list
    UPDATE users
    SET followers = array_append(followers, follower_id)
    WHERE user_id = followee_id
    AND NOT (follower_id = ANY(followers));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create unfollow_user function
CREATE OR REPLACE FUNCTION unfollow_user(follower_id UUID, followee_id UUID)
RETURNS void AS $$
BEGIN
    -- Remove followee from follower's following list
    UPDATE users
    SET following = array_remove(following, followee_id)
    WHERE user_id = follower_id;
    
    -- Remove follower from followee's followers list
    UPDATE users
    SET followers = array_remove(followers, follower_id)
    WHERE user_id = followee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION follow_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_user(UUID, UUID) TO authenticated;
