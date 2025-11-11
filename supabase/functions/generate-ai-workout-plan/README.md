# Generate AI Workout Plan Edge Function

This Supabase Edge Function generates personalized workout plans using Google Gemini AI based on user form data.

## Setup

### 1. Set Gemini API Key

You need to set the `GEMINI_API_KEY` secret in your Supabase project:

```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

To get a Gemini API key:

1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create a new key for your project

### 2. Deploy the Function

```bash
supabase functions deploy generate-ai-workout-plan
```

## Usage

The function accepts a POST request with a JSON body:

```json
{
  "formData": {
    "planTarget": "calisthenics" | "specific_exercise",
    "specificExercise": "Exercise name (if planTarget is specific_exercise)",
    "maxReps": {
      "pushups": 10,
      "pullups": 5,
      "dips": 8,
      "squats": 20
    },
    "age": 25,
    "height": 178,
    "heightUnit": "cm",
    "weight": 70,
    "weightUnit": "kg" | "lbs",
    "activityLevel": "beginner" | "intermediate" | "advanced",
    "currentWorkoutDays": 2,
    "workoutsPerWeek": 3,
    "availableDays": [0, 2, 4],
    "startDate": "2024-01-01T00:00:00.000Z"
  },
  "userId": "user-uuid"
}
```

**Parameters:**

- `formData` (required): Complete form data from the multi-step form
- `userId` (optional): User ID for analytics tracking

## Response

The function returns structured workout plan data:

```json
{
  "name": "4-Week Calisthenics Beginner Program",
  "description": "A progressive calisthenics program for beginners",
  "num_weeks": 4,
  "workouts": {
    "A": {
      "name": "Upper Body Strength",
      "exercises": [
        {
          "exercise_name": "Push-ups",
          "sets": 3,
          "reps": 10,
          "rest_seconds": 60
        }
      ]
    },
    "B": {
      "name": "Lower Body & Core",
      "exercises": [...]
    }
  },
  "schedule": [
    ["A", "rest", "B", "rest", "A", "rest", "rest"],
    ["B", "rest", "A", "rest", "B", "rest", "rest"]
  ]
}
```

## Error Handling

The function returns appropriate error messages if:

- Form data is missing or invalid
- AI generation fails
- Exercise matching fails

## Features

- Generates personalized workout plans based on user fitness level
- Creates progressive programs (4-6 weeks)
- Matches exercises to database or creates new ones
- Generates schedules based on available days
- Accounts for user height, weight, and current training frequency
- Handles static and dynamic exercises correctly
- Supports supersets and unilateral exercises
