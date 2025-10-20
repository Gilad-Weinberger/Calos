# Analyze Workout Plan Edge Function

This Supabase Edge Function analyzes PDF workout plans using Google Gemini AI and extracts structured workout data.

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
supabase functions deploy analyze-workout-plan
```

## Usage

The function accepts a POST request with a JSON body:

```json
{
  "pdfUrl": "https://your-supabase-url.supabase.co/storage/v1/object/public/workout-plans/user-id/file.pdf",
  "aiNotes": "Optional instructions for the AI (e.g., 'Ignore warmup exercises')"
}
```

**Parameters:**

- `pdfUrl` (required): URL of the PDF to analyze
- `aiNotes` (optional): Custom instructions to guide the AI analysis. Use this to:
  - Exclude specific exercise types (e.g., "Ignore warmup and cooldown exercises")
  - Focus on specific details (e.g., "Focus only on compound movements")
  - Clarify ambiguous information (e.g., "Treat all sets as working sets, not warmup sets")

## Response

The function returns structured workout plan data:

```json
{
  "name": "6 Week Push/Pull Program",
  "description": "A balanced push/pull workout routine",
  "num_weeks": 2,
  "workouts": {
    "A": {
      "name": "Push Day",
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
      "name": "Pull Day",
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

- PDF URL is not provided
- PDF cannot be downloaded
- AI analysis fails
- Response cannot be parsed as JSON

## Local Testing

```bash
supabase functions serve analyze-workout-plan --no-verify-jwt
```

Then send a test request:

```bash
curl -X POST http://localhost:54321/functions/v1/analyze-workout-plan \
  -H "Content-Type: application/json" \
  -d '{"pdfUrl": "your-pdf-url", "aiNotes": "Ignore warmup exercises"}'
```
