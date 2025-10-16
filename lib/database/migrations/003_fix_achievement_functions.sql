-- Fix ambiguous column references in achievement functions

-- Fix get_user_personal_record function
CREATE OR REPLACE FUNCTION get_user_personal_record(p_user_id UUID, p_exercise_id UUID)
RETURNS TABLE (
    exercise_id UUID,
    exercise_name TEXT,
    exercise_type exercise_type,
    amount INTEGER,
    achieved_at TIMESTAMPTZ,
    workout_id UUID
) AS $$
BEGIN
    RETURN QUERY
    WITH exercise_performances AS (
        SELECT 
            we.exercise_id,
            e.name,
            e.type,
            w.workout_date,
            w.workout_id,
            GREATEST(we.reps) as performance_amount -- For both static and dynamic exercises, use max reps in single set
        FROM workout_exercises we
        JOIN exercises e ON e.exercise_id = we.exercise_id
        JOIN workouts w ON w.workout_id = we.workout_id
        WHERE w.user_id = p_user_id 
            AND we.exercise_id = p_exercise_id
        GROUP BY we.exercise_id, e.name, e.type, w.workout_date, w.workout_id, we.reps
    )
    SELECT 
        ep.exercise_id,
        ep.name,
        ep.type,
        ep.performance_amount as amount,
        ep.workout_date as achieved_at,
        ep.workout_id
    FROM exercise_performances ep
    ORDER BY ep.performance_amount DESC, ep.workout_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_user_exercise_rankings function
CREATE OR REPLACE FUNCTION get_user_exercise_rankings(p_user_id UUID, p_exercise_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    exercise_id UUID,
    exercise_name TEXT,
    exercise_type exercise_type,
    amount INTEGER,
    achieved_at TIMESTAMPTZ,
    workout_id UUID,
    rank_position BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH individual_sets AS (
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
        WHERE w.user_id = p_user_id 
            AND we.exercise_id = p_exercise_id
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
        rp.rank_pos as rank_position
    FROM ranked_performances rp
    WHERE rp.rank_pos <= p_limit
    ORDER BY rp.rank_pos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_user_exercise_podium function
CREATE OR REPLACE FUNCTION get_user_exercise_podium(p_user_id UUID, p_exercise_id UUID)
RETURNS TABLE (
    exercise_id UUID,
    exercise_name TEXT,
    exercise_type exercise_type,
    amount INTEGER,
    achieved_at TIMESTAMPTZ,
    workout_id UUID,
    podium_position INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH individual_sets AS (
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
        WHERE w.user_id = p_user_id 
            AND we.exercise_id = p_exercise_id
    ),
    ranked_performances AS (
        SELECT 
            ind.exercise_id,
            ind.name,
            ind.type,
            ind.workout_date,
            ind.workout_id,
            ind.performance_amount,
            DENSE_RANK() OVER (
                ORDER BY ind.performance_amount DESC
            ) as podium_pos
        FROM individual_sets ind
    )
    SELECT 
        rp.exercise_id,
        rp.name,
        rp.type,
        rp.performance_amount as amount,
        rp.workout_date as achieved_at,
        rp.workout_id,
        rp.podium_pos::INTEGER as podium_position
    FROM ranked_performances rp
    WHERE rp.podium_pos <= 3
    ORDER BY rp.podium_pos, rp.workout_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
