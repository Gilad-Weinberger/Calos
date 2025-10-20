-- Comprehensive exercise list with variations and progressions
-- Skip if exercises already exist (no duplicates)

-- Push exercises (vertical pushing - overhead)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Pike Push-ups', 'Push-up with hips elevated, targeting shoulders more than standard push-ups', 'dynamic'),
    ('Elevated Pike Push-ups', 'Pike push-up with feet elevated on a platform for increased difficulty', 'dynamic'),
    ('Wall Handstand Push-ups (Back to Wall)', 'Handstand push-ups performed with back against wall for support', 'dynamic'),
    ('Wall Handstand Push-ups (Facing Wall)', 'Handstand push-ups facing wall for better balance and stricter form', 'dynamic'),
    ('Freestanding Handstand Push-ups', 'Advanced handstand push-ups without wall support', 'dynamic'),
    ('Deficit Handstand Push-ups', 'Handstand push-ups on parallettes or blocks for increased range of motion', 'dynamic'),
    ('90-Degree Push-ups', 'Wall-supported push position with body parallel to ground', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Push exercises (horizontal pushing - chest)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Incline Push-ups', 'Push-ups with hands elevated, easier variation for beginners', 'dynamic'),
    ('Standard Push-ups', 'Classic push-up from the ground', 'dynamic'),
    ('Wide Push-ups', 'Push-ups with hands placed wider than shoulders', 'dynamic'),
    ('Diamond Push-ups', 'Push-ups with hands forming a diamond shape, targeting triceps', 'dynamic'),
    ('Decline Push-ups', 'Push-ups with feet elevated for increased difficulty', 'dynamic'),
    ('Archer Push-ups', 'One-arm push-up progression with extended arm for support', 'dynamic'),
    ('Typewriter Push-ups', 'Push-up moving side to side in bottom position', 'dynamic'),
    ('Pseudo Planche Push-ups', 'Push-ups with hands by hips and body leaned forward', 'dynamic'),
    ('One-Arm Push-ups', 'Advanced push-up performed with one arm', 'dynamic'),
    ('Clapping Push-ups', 'Explosive push-up with hands leaving the ground to clap', 'dynamic'),
    ('Superman Push-ups', 'Explosive push-up with arms and legs leaving the ground', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Pull exercises (vertical pulling)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Dead Hang', 'Hanging from bar with arms fully extended', 'static'),
    ('Scapular Pull-ups', 'Pull-up focusing on scapular retraction only', 'dynamic'),
    ('Assisted Pull-ups', 'Pull-ups with band or foot assistance', 'dynamic'),
    ('Negative Pull-ups', 'Focusing on controlled descent from top position', 'dynamic'),
    ('Chin-ups', 'Pull-ups with underhand (supinated) grip', 'dynamic'),
    ('Close Grip Pull-ups', 'Pull-ups with hands close together', 'dynamic'),
    ('Wide Grip Pull-ups', 'Pull-ups with hands wider than shoulders', 'dynamic'),
    ('Commando Pull-ups', 'Pull-ups with parallel grip, alternating sides', 'dynamic'),
    ('Archer Pull-ups', 'One-arm pull-up progression with extended arm for support', 'dynamic'),
    ('Typewriter Pull-ups', 'Pull-up moving side to side in top position', 'dynamic'),
    ('L-sit Pull-ups', 'Pull-ups performed while holding L-sit position', 'dynamic'),
    ('One-Arm Pull-ups', 'Advanced pull-up performed with one arm', 'dynamic'),
    ('Weighted Pull-ups', 'Pull-ups with added weight (belt, vest, or dumbbell)', 'dynamic'),
    ('Muscle-up', 'Combination of pull-up and dip, transitioning over the bar', 'dynamic'),
    ('Strict Muscle-up', 'Muscle-up without kipping or momentum', 'dynamic'),
    ('Slow Muscle-up', 'Muscle-up performed with controlled tempo', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Pull exercises (horizontal pulling - rows)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Incline Rows', 'Horizontal rows at steep angle, easier variation', 'dynamic'),
    ('Australian Pull-ups', 'Horizontal pull-ups under a bar with body at angle', 'dynamic'),
    ('Horizontal Rows', 'Body horizontal during rowing motion', 'dynamic'),
    ('Wide Grip Rows', 'Horizontal rows with wider hand placement', 'dynamic'),
    ('Close Grip Rows', 'Horizontal rows with close hand placement', 'dynamic'),
    ('Archer Rows', 'One-arm row progression with extended arm for support', 'dynamic'),
    ('One-Arm Rows', 'Advanced horizontal row with one arm', 'dynamic'),
    ('Front Lever Rows', 'Rows performed from front lever position', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Dips progressions
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Bench Dips', 'Dips performed on bench or box with feet on ground', 'dynamic'),
    ('Assisted Dips', 'Dips with band or foot assistance', 'dynamic'),
    ('Parallel Bar Dips', 'Standard dips on parallel bars', 'dynamic'),
    ('Ring Dips', 'Dips performed on gymnastics rings (more unstable)', 'dynamic'),
    ('Wide Dips', 'Dips with wider hand placement', 'dynamic'),
    ('Korean Dips', 'Dips with hands behind back on rings', 'dynamic'),
    ('Weighted Dips', 'Dips with added weight', 'dynamic'),
    ('Bulgarian Dips', 'Dips with body leaned forward and hands behind', 'dynamic'),
    ('Russian Dips', 'Deep dips with shoulders below elbows', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Core exercises (dynamic)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Crunches', 'Basic abdominal crunch exercise', 'dynamic'),
    ('Bicycle Crunches', 'Alternating elbow to knee crunches', 'dynamic'),
    ('Sit-ups', 'Full range abdominal exercise', 'dynamic'),
    ('V-ups', 'Simultaneous leg and torso raise to form V shape', 'dynamic'),
    ('Knee Raises', 'Raising knees toward chest while hanging or supported', 'dynamic'),
    ('Hanging Knee Raises', 'Knee raises performed hanging from bar', 'dynamic'),
    ('Toes to Bar', 'Bringing toes all the way to the bar while hanging', 'dynamic'),
    ('Windshield Wipers', 'Rotating legs side to side while hanging', 'dynamic'),
    ('Dragon Flags', 'Advanced core exercise with body rigid, pivoting at shoulders', 'dynamic'),
    ('Ab Wheel Rollouts', 'Rolling ab wheel forward while maintaining core tension', 'dynamic'),
    ('Standing Ab Wheel Rollouts', 'Ab wheel rollouts from standing position', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Core exercises (static holds)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Hollow Body Hold', 'Static hold with lower back pressed to ground, arms and legs extended', 'static'),
    ('Arch Body Hold', 'Static hold in arched position, opposite of hollow body', 'static'),
    ('Dead Bug Hold', 'Core hold with alternating arm and leg movements', 'static'),
    ('Side Plank', 'Plank performed on one side', 'static'),
    ('Forearm Plank', 'Plank on forearms instead of hands', 'static'),
    ('Extended Plank', 'Plank with arms extended further forward', 'static'),
    ('RTO Support Hold', 'Ring support with rings turned out', 'static'),
    ('L-sit on Floor', 'L-sit performed on ground with hands pushing down', 'static'),
    ('L-sit on Parallettes', 'L-sit on raised parallettes for full range', 'static'),
    ('Tuck L-sit', 'L-sit with knees tucked to chest', 'static'),
    ('One-Leg L-sit', 'L-sit with one leg extended, one tucked', 'static'),
    ('V-sit', 'Advanced L-sit with legs raised higher than hips', 'static'),
    ('Manna', 'Extreme L-sit with legs raised above head', 'static')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Leg exercises (squats and variations)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Bodyweight Squats', 'Standard air squats', 'dynamic'),
    ('Jump Squats', 'Explosive squats with jump', 'dynamic'),
    ('Bulgarian Split Squats', 'Single leg squat with rear foot elevated', 'dynamic'),
    ('Pistol Squat Progression', 'One-leg squat holding onto support', 'dynamic'),
    ('Pistol Squats', 'Full one-leg squat to ground', 'dynamic'),
    ('Shrimp Squats', 'One-leg squat with rear leg bent behind', 'dynamic'),
    ('Sissy Squats', 'Squat leaning back with knees forward', 'dynamic'),
    ('Cossack Squats', 'Side-to-side squats with alternating legs', 'dynamic'),
    ('Box Squats', 'Squats to a box or bench', 'dynamic'),
    ('Wall Sits', 'Static squat hold against wall', 'static')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Leg exercises (lunges and variations)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Forward Lunges', 'Standard lunges stepping forward', 'dynamic'),
    ('Reverse Lunges', 'Lunges stepping backward', 'dynamic'),
    ('Walking Lunges', 'Continuous lunges moving forward', 'dynamic'),
    ('Jump Lunges', 'Explosive lunges with switch in air', 'dynamic'),
    ('Lateral Lunges', 'Lunges to the side', 'dynamic'),
    ('Curtsy Lunges', 'Lunges with rear leg crossing behind', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Leg exercises (calves and posterior chain)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Calf Raises', 'Rising onto toes to work calves', 'dynamic'),
    ('Single-Leg Calf Raises', 'Calf raises performed one leg at a time', 'dynamic'),
    ('Glute Bridges', 'Hip thrust from ground with shoulders on floor', 'dynamic'),
    ('Single-Leg Glute Bridges', 'Hip thrust with one leg extended', 'dynamic'),
    ('Nordic Curls', 'Kneeling hamstring curl with eccentric control', 'dynamic'),
    ('Harop Curls', 'Hamstring curl from elevated position', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Advanced static holds (straight arm strength)
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Tuck Planche', 'Planche with knees tucked to chest', 'static'),
    ('Advanced Tuck Planche', 'Tuck planche with knees away from chest', 'static'),
    ('Straddle Planche', 'Planche with legs in straddle position', 'static'),
    ('Full Planche', 'Full planche with legs together and straight', 'static'),
    ('Planche Lean', 'Leaning forward in plank position to build planche strength', 'static'),
    ('Frog Stand', 'Hands on ground with knees resting on elbows', 'static'),
    ('Tuck Front Lever', 'Front lever with knees tucked', 'static'),
    ('Advanced Tuck Front Lever', 'Tuck front lever with knees away from chest', 'static'),
    ('One-Leg Front Lever', 'Front lever with one leg extended', 'static'),
    ('Straddle Front Lever', 'Front lever with legs in straddle position', 'static'),
    ('Full Front Lever', 'Front lever with legs together and straight', 'static'),
    ('German Hang', 'Hanging from rings with arms behind body', 'static'),
    ('Skin the Cat', 'Rotating backward through rings to German hang', 'dynamic'),
    ('Back Lever', 'Lever position on back side of bar or rings', 'static'),
    ('Human Flag', 'Holding body horizontal on vertical pole', 'static')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Handstand progressions
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Wall Walk', 'Walking feet up wall while hands walk back', 'dynamic'),
    ('Chest to Wall Handstand', 'Handstand facing wall', 'static'),
    ('Back to Wall Handstand', 'Handstand with back to wall', 'static'),
    ('Freestanding Handstand', 'Handstand without wall support', 'static'),
    ('Bent Arm Handstand', 'Handstand with arms bent (easier balance)', 'static'),
    ('One-Arm Handstand', 'Advanced handstand on one arm', 'static'),
    ('Handstand Walk', 'Walking on hands while in handstand', 'dynamic'),
    ('Straddle Handstand Press', 'Pressing into handstand from straddle position', 'dynamic'),
    ('Pike Handstand Press', 'Pressing into handstand from pike position', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Bridge and flexibility
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Bridge', 'Back bend from ground with hands and feet planted', 'static'),
    ('Bridge Push-ups', 'Pushing up and down in bridge position', 'dynamic'),
    ('Wall Bridge', 'Bridge walking hands down wall', 'static'),
    ('Stand-to-Bridge', 'Bending back into bridge from standing', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Mobility and flexibility holds
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Deep Squat Hold', 'Holding bottom position of squat', 'static'),
    ('Horse Stance', 'Wide stance squat hold', 'static'),
    ('Jefferson Curl', 'Slow controlled spinal flexion with straight legs', 'dynamic'),
    ('Pancake Stretch Hold', 'Forward fold in straddle position', 'static')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Cardio and conditioning
INSERT INTO exercises (name, description, type) 
SELECT v.name, v.description, v.type::exercise_type FROM (VALUES
    ('Burpees', 'Full body exercise: squat, plank, push-up, jump', 'dynamic'),
    ('Jump Rope', 'Cardiovascular exercise with jump rope', 'dynamic'),
    ('High Knees', 'Running in place with high knee drive', 'dynamic'),
    ('Mountain Climbers', 'Plank position with alternating knee drives', 'dynamic'),
    ('Jumping Jacks', 'Cardio exercise with arm and leg coordination', 'dynamic'),
    ('Bear Crawl', 'Crawling on hands and feet', 'dynamic'),
    ('Crab Walk', 'Walking on hands and feet with chest facing up', 'dynamic')
) AS v(name, description, type)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises WHERE exercises.name = v.name
);

-- Update descriptions for existing exercises if they exist
UPDATE exercises SET description = 'Standard push-ups from the ground' WHERE name = 'Push-ups' AND description = 'Classic bodyweight chest and arm exercise';
UPDATE exercises SET description = 'Standard pull-ups with overhand grip' WHERE name = 'Pull-ups' AND description = 'Upper body pulling exercise targeting back and biceps';
UPDATE exercises SET description = 'Standard parallel bar dips' WHERE name = 'Dips' AND description = 'Tricep and chest exercise using parallel bars or rings';
UPDATE exercises SET description = 'Bodyweight squats' WHERE name = 'Squats' AND description = 'Lower body exercise targeting quadriceps and glutes';
UPDATE exercises SET description = 'Forward lunges' WHERE name = 'Lunges' AND description = 'Single-leg lower body exercise for strength and balance';
UPDATE exercises SET description = 'Standard plank on hands or forearms' WHERE name = 'Plank' AND description = 'Core strengthening exercise held in push-up position';
UPDATE exercises SET description = 'Standard L-sit holding legs parallel to ground' WHERE name = 'L-sit' AND description = 'Advanced core exercise holding legs parallel to ground';
UPDATE exercises SET description = 'Standard handstand push-ups' WHERE name = 'Handstand Push-ups' AND description = 'Advanced upper body exercise in inverted position';
UPDATE exercises SET description = 'Standard muscle-up combining pull-up and dip' WHERE name = 'Muscle-ups' AND description = 'Advanced compound exercise combining pull-up and dip';
UPDATE exercises SET description = 'Hanging leg raises from bar with straight legs' WHERE name = 'Hanging Leg Raises' AND description = 'Core exercise performed hanging from a bar';

