# Modify Workout Plan Edge Function

This Supabase Edge Function uses Gemini AI to modify existing workout plans based on user natural language prompts.

## Overview

The function accepts a user's current workout plan and a text prompt describing desired changes. It uses AI to intelligently modify the plan while respecting constraints like plan type and structural requirements.

## Request Format

```json
{
  "currentPlan": {
    "plan_id": "uuid",
    "user_id": "uuid",
    "name": "Plan Name",
    "description": "Plan description",
    "is_active": true,
    "plan_type": "repeat" | "once",
    "num_weeks": 4,
    "workouts": {
      "A": {
        "name": "Workout A",
        "exercises": [...]
      }
    },
    "schedule": [
      ["A", "rest", "B", "rest", "A", "rest", "rest"],
      ...
    ],
    "start_date": "2024-01-01T00:00:00.000Z"
  },
  "userPrompt": "Add more leg exercises",
  "userId": "uuid"
}
```

## Response Format

```json
{
  "workouts": {
    "A": {
      "name": "Workout A",
      "exercises": [
        {
          "exercise_id": "uuid",
          "exercise_name": "Push-ups",
          "sets": 3,
          "reps": 10,
          "rest_seconds": 60
        }
      ]
    }
  },
  "schedule": [
    ["A", "rest", "B", "rest", "A", "rest", "rest"],
    ...
  ],
  "num_weeks": 4,
  "start_date": "2024-01-01T00:00:00.000Z"
}
```

## Constraints

1. **Plan Type**: Cannot be changed. The function preserves the original plan_type.
2. **Number of Weeks**: 
   - For 'repeat' plans: Cannot be changed (fixed cycle length)
   - For 'once' plans: Can be changed if requested
3. **Schedule Format**: Must maintain 7 days per week (Sunday to Saturday)
4. **Workout Letters**: Must be uppercase (A, B, C, etc.)
5. **Rest Days**: Must be lowercase "rest"

## Example Prompts

- "Add more leg exercises to workout A"
- "Change schedule to Monday, Wednesday, Friday only"
- "Remove all pull-up exercises"
- "Make the plan 6 weeks instead of 4" (only works for 'once' plans)
- "Start the plan next Monday"
- "Add core exercises to every workout"
- "Increase rest time between sets to 90 seconds"

## Environment Variables

- `GEMINI_API_KEY`: Google Gemini API key (required)
- `SUPABASE_URL`: Supabase project URL (required)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (required)
- `POSTHOG_API_KEY`: PostHog API key (optional, for analytics)
- `POSTHOG_HOST`: PostHog host URL (optional, defaults to https://us.i.posthog.com)

## Analytics

The function tracks the following metrics via PostHog:
- AI model used (gemini-2.5-flash)
- Latency in seconds
- Input/output token counts
- Total cost in USD
- Plan type
- Number of workouts
- Number of weeks
- User prompt length

## Error Handling

The function returns appropriate error messages for:
- Missing required fields
- Invalid plan data
- AI parsing errors
- Database errors
- Invalid modifications (e.g., attempting to change plan_type)

## Development

To test locally:

```bash
supabase functions serve modify-workout-plan --env-file .env.local
```

To deploy:

```bash
supabase functions deploy modify-workout-plan
```

