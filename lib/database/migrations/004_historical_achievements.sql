-- Add historical achievement function for workout-specific rankings
-- This function calculates rankings based only on workouts up to and including a specific workout

-- Drop the existing function first to allow return type change
DROP FUNCTION IF EXISTS get_user_exercise_rankings_until_workout(UUID, UUID, UUID, INTEGER);

-- Get user's best N attempts for a specific exercise up to a specific workout (ranked from best to worst)
CREATE OR REPLACE FUNCTION get_user_exercise_rankings_until_workout(
    p_user_id UUID, 
    p_exercise_id UUID, 
    p_workout_id UUID, 
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    exercise_id UUID,
    exercise_name TEXT,
    exercise_type exercise_type,
    amount INTEGER,
    achieved_at TIMESTAMPTZ,
    workout_id UUID,
    rank_position INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH target_workout_date AS (
        SELECT w.workout_date 
        FROM workouts w
        WHERE w.workout_id = p_workout_id
    ),
    individual_sets AS (
        SELECT 
            we.exercise_id,
            e.name,
            e.type,
            w.workout_date,
            w.workout_id,
            unnest(we.reps) as performance_amount
        FROM workout_exercises we
        JOIN exercises e ON e.exercise_id = we.exercise_id
        JOIN workouts w ON w.workout_id = we.workout_id
        CROSS JOIN target_workout_date twd
        WHERE w.user_id = p_user_id 
            AND we.exercise_id = p_exercise_id
            AND w.workout_date <= twd.workout_date
    ),
    ranked_performances AS (
        SELECT 
            ind.exercise_id,
            ind.name,
            ind.type,
            ind.workout_date,
            ind.workout_id,
            ind.performance_amount,
            ROW_NUMBER() OVER (
                ORDER BY ind.performance_amount DESC, ind.workout_date DESC
            ) as rank_pos
        FROM individual_sets ind
    )
    SELECT 
        rp.exercise_id,
        rp.name,
        rp.type,
        rp.performance_amount as amount,
        rp.workout_date as achieved_at,
        rp.workout_id,
        rp.rank_pos::INTEGER as rank_position
    FROM ranked_performances rp
    WHERE rp.rank_pos <= p_limit
    ORDER BY rp.rank_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
