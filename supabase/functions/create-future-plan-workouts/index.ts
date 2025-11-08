import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Plan {
  plan_id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  plan_type: "repeat" | "once";
  num_weeks: number;
  workouts: any;
  schedule: string[][];
  start_date: string;
  created_at: string;
  updated_at: string;
}

interface Exercise {
  exercise_id: string;
  name: string;
  type: "static" | "dynamic";
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(
      "🔄 Starting future workout creation for active recurring plans..."
    );

    // Query ONLY active recurring plans
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("*")
      .eq("plan_type", "repeat")
      .eq("is_active", true);

    if (plansError) {
      console.error("Error fetching active plans:", plansError);
      throw plansError;
    }

    if (!plans || plans.length === 0) {
      console.log("No active recurring plans found");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active recurring plans found",
          plansProcessed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found ${plans.length} active recurring plan(s)`);

    // Get all exercises to map exercise names to IDs
    const { data: allExercises, error: exercisesError } = await supabase
      .from("exercises")
      .select("exercise_id, name, type");

    if (exercisesError) {
      console.error("Error fetching exercises:", exercisesError);
      throw exercisesError;
    }

    const exercisesMap = new Map<string, Exercise>();
    allExercises?.forEach((ex: Exercise) => {
      exercisesMap.set(ex.name.toLowerCase(), ex);
    });

    let plansProcessed = 0;
    let workoutsCreated = 0;
    const errors: string[] = [];

    // Process each active plan
    for (const plan of plans as Plan[]) {
      try {
        console.log(`Processing plan: ${plan.name} (${plan.plan_id})`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(plan.start_date);
        startDate.setHours(0, 0, 0, 0);

        const daysElapsed = Math.floor(
          (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const currentWeek = Math.floor(daysElapsed / 7) % plan.num_weeks;
        const nextWeek = (currentWeek + 1) % plan.num_weeks;

        // Check if we have workouts for the current week
        const currentWeekStart = new Date(startDate);
        const currentCycle = Math.floor(daysElapsed / (plan.num_weeks * 7));
        currentWeekStart.setDate(
          startDate.getDate() +
            currentCycle * plan.num_weeks * 7 +
            currentWeek * 7
        );

        const { count: currentWeekCount } = await supabase
          .from("workouts")
          .select("*", { count: "exact", head: true })
          .eq("plan_id", plan.plan_id)
          .eq("done", false)
          .gte("scheduled_date", currentWeekStart.toISOString())
          .lt(
            "scheduled_date",
            new Date(
              currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
            ).toISOString()
          );

        // If we have workouts for current week but not next week, create next week
        if (currentWeekCount && currentWeekCount > 0) {
          // Calculate which cycle we're in
          const cycleLength = plan.num_weeks * 7;
          const cycleStartDate = new Date(startDate);
          cycleStartDate.setDate(
            startDate.getDate() + currentCycle * cycleLength
          );

          // Determine the target week (handle wrap-around)
          let targetWeekNumber = nextWeek;
          if (nextWeek >= plan.num_weeks) {
            // Wrap around to next cycle, week 0
            targetWeekNumber = 0;
            cycleStartDate.setDate(cycleStartDate.getDate() + cycleLength);
          }

          // Check if workouts for this week already exist
          const weekStartDate = new Date(cycleStartDate);
          weekStartDate.setDate(
            cycleStartDate.getDate() + targetWeekNumber * 7
          );
          weekStartDate.setHours(0, 0, 0, 0);

          const { count: existingCount } = await supabase
            .from("workouts")
            .select("*", { count: "exact", head: true })
            .eq("plan_id", plan.plan_id)
            .eq("done", false)
            .gte("scheduled_date", weekStartDate.toISOString())
            .lt(
              "scheduled_date",
              new Date(
                weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000
              ).toISOString()
            );

          if (existingCount && existingCount > 0) {
            console.log(
              `Workouts already exist for week ${targetWeekNumber} of plan ${plan.name}`
            );
            continue;
          }

          // Create workouts for the target week
          const weekSchedule = plan.schedule[targetWeekNumber];
          if (!weekSchedule) {
            console.warn(
              `No schedule found for week ${targetWeekNumber} in plan ${plan.name}`
            );
            continue;
          }

          const workoutsToCreate: {
            user_id: string;
            workout_date: string;
            plan_id: string;
            plan_workout_letter: string;
            scheduled_date: string;
            done: boolean;
          }[] = [];

          weekSchedule.forEach((workoutLetter, dayIndex) => {
            const dayLower = workoutLetter?.toLowerCase().trim();
            if (!dayLower || dayLower === "rest" || dayLower === "") {
              return; // Skip rest days
            }

            const workout = plan.workouts[workoutLetter];
            if (!workout) {
              console.warn(`Workout ${workoutLetter} not found in plan`);
              return;
            }

            const scheduledDate = new Date(weekStartDate);
            scheduledDate.setDate(weekStartDate.getDate() + dayIndex);
            scheduledDate.setHours(0, 0, 0, 0);

            workoutsToCreate.push({
              user_id: plan.user_id,
              workout_date: scheduledDate.toISOString(),
              plan_id: plan.plan_id,
              plan_workout_letter: workoutLetter,
              scheduled_date: scheduledDate.toISOString(),
              done: false,
            });
          });

          // Create workouts and their exercises
          for (const workoutData of workoutsToCreate) {
            const workoutLetter = workoutData.plan_workout_letter;
            const workoutDef = plan.workouts[workoutLetter];

            // Create workout record
            const { data: workout, error: workoutError } = await supabase
              .from("workouts")
              .insert(workoutData)
              .select("workout_id")
              .single();

            if (workoutError) {
              console.error(
                `Error creating workout ${workoutLetter} for plan ${plan.name}:`,
                workoutError
              );
              errors.push(
                `Plan ${plan.name}: Failed to create workout ${workoutLetter}`
              );
              continue;
            }

            workoutsCreated++;

            // Create workout exercises
            const workoutExercises = (workoutDef.exercises as any[])
              .map((exDef: any, index: number) => {
                // Find exercise by name
                const exercise = exercisesMap.get(
                  exDef.exercise_name.toLowerCase()
                );

                if (!exercise) {
                  console.warn(
                    `Exercise ${exDef.exercise_name} not found in database for plan ${plan.name}`
                  );
                  return null;
                }

                // Convert reps/duration to array format
                let repsArray: number[];
                if (exercise.type === "static") {
                  // Static exercise: use duration value repeated for each set
                  const durationValue = exDef.duration || 30; // Default 30 seconds
                  repsArray = new Array(exDef.sets).fill(durationValue);
                } else {
                  // Dynamic exercise: use reps value repeated for each set
                  if (Array.isArray(exDef.reps)) {
                    repsArray = exDef.reps;
                  } else if (typeof exDef.reps === "number") {
                    repsArray = new Array(exDef.sets).fill(exDef.reps);
                  } else {
                    // Default to 0 if no reps specified
                    repsArray = new Array(exDef.sets).fill(0);
                  }
                }

                return {
                  workout_id: workout.workout_id,
                  exercise_id: exercise.exercise_id,
                  sets: exDef.sets,
                  reps: repsArray,
                  order_index: index + 1,
                  rest_seconds: exDef.rest_seconds || 0,
                  superset_group: exDef.superset_group || null,
                };
              })
              .filter((ex) => ex !== null);

            if (workoutExercises.length > 0) {
              const { error: exercisesError } = await supabase
                .from("workout_exercises")
                .insert(workoutExercises);

              if (exercisesError) {
                console.error(
                  `Error creating exercises for workout ${workoutLetter} in plan ${plan.name}:`,
                  exercisesError
                );
                // Clean up the workout if exercises fail
                await supabase
                  .from("workouts")
                  .delete()
                  .eq("workout_id", workout.workout_id);
                errors.push(
                  `Plan ${plan.name}: Failed to create exercises for workout ${workoutLetter}`
                );
                workoutsCreated--;
              }
            }
          }

          plansProcessed++;
          console.log(
            `✅ Successfully created workouts for next week in plan: ${plan.name}`
          );
        } else {
          console.log(
            `No current week workouts found for plan ${plan.name}, skipping`
          );
        }
      } catch (error) {
        console.error(`Error processing plan ${plan.name}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push(`Plan ${plan.name}: ${errorMessage}`);
      }
    }

    const response = {
      success: true,
      plansProcessed,
      workoutsCreated,
      totalPlans: plans.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("✅ Future workout creation completed:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error in create-future-plan-workouts:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
