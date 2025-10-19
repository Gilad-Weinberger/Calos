-- Add total reps per exercise achievement function
-- This function calculates rankings based on total reps performed in an exercise per workout

-- Drop the existing function first to allow return type change
DROP FUNCTION IF EXISTS get_user_exercise_total_reps_rankings_until_workout(UUID, UUID, UUID, INTEGER);

-- Get user's best total reps for a specific exercise up to a specific workout (ranked from best to worst)
CREATE OR REPLACE FUNCTION get_user_exercise_total_reps_rankings_until_workout(
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
    workout_totals AS (
        SELECT 
            we.exercise_id,
            e.name,
            e.type,
            w.workout_date,
            w.workout_id,
            SUM(val)::INTEGER as total_reps
        FROM workout_exercises we
        JOIN exercises e ON e.exercise_id = we.exercise_id
        JOIN workouts w ON w.workout_id = we.workout_id
        CROSS JOIN target_workout_date twd
        CROSS JOIN LATERAL unnest(we.reps) as val
        WHERE w.user_id = p_user_id 
            AND we.exercise_id = p_exercise_id
            AND w.workout_date <= twd.workout_date
        GROUP BY we.exercise_id, e.name, e.type, w.workout_date, w.workout_id
    ),
    ranked_totals AS (
        SELECT 
            wt.exercise_id,
            wt.name,
            wt.type,
            wt.workout_date,
            wt.workout_id,
            wt.total_reps,
            ROW_NUMBER() OVER (
                ORDER BY wt.total_reps DESC, wt.workout_date DESC
            ) as rank_pos
        FROM workout_totals wt
    )
    SELECT 
        rt.exercise_id,
        rt.name,
        rt.type,
        rt.total_reps as amount,
        rt.workout_date as achieved_at,
        rt.workout_id,
        rt.rank_pos::INTEGER as rank_position
    FROM ranked_totals rt
    WHERE rt.rank_pos <= p_limit
    ORDER BY rt.rank_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
