# Analyze Workout Videos Edge Function

This Supabase Edge Function uses the Gemini AI Vision API to analyze workout videos and detect exercises, count reps, and measure duration.

## Setup

### 1. Environment Variables

Set the following environment variables in your Supabase project:

```bash
# Set in Supabase Dashboard > Edge Functions > Secrets
GEMINI_API_KEY=your_gemini_api_key_here
```

To get a Gemini API key:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and save it securely

### 2. Deploy the Function

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy analyze-workout-videos
```

### 3. Set Environment Variables

```bash
supabase secrets set GEMINI_API_KEY=your_key_here
```

## Usage

The function accepts a POST request with the following body:

```json
{
  "videoUrls": [
    "https://your-project.supabase.co/storage/v1/object/public/workout-videos/user-id/video1.mp4",
    "https://your-project.supabase.co/storage/v1/object/public/workout-videos/user-id/video2.mp4"
  ]
}
```

Returns:

```json
{
  "results": [
    {
      "exercise_id": "uuid",
      "exercise_name": "Push-ups",
      "exercise_type": "dynamic",
      "video_urls": ["url1", "url2"],
      "reps": [10, 12],
      "confidence": 0.95,
      "sets": 2
    }
  ]
}
```

## Testing Locally

```bash
# Start Supabase locally
supabase start

# Serve the function
supabase functions serve analyze-workout-videos --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/analyze-workout-videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"videoUrls": ["video_url_here"]}'
```

## Notes

- Videos must be uploaded to the `workout-videos` storage bucket first
- **Maximum video size: 50MB (after compression)** - Videos larger than this will be rejected to prevent memory issues
- Videos are automatically compressed on the client side before upload using `react-native-compressor`
- The function uses the Gemini File API (`gemini-2.5-flash` model) for efficient video processing
- Processing time varies based on video length (typically 10-30 seconds per video)
- The Gemini API has rate limits - check your quota in Google AI Studio

## Memory Optimization

The edge function includes several optimizations to prevent "Memory limit exceeded" errors:

1. **Pre-upload size validation**: Checks file size before downloading to avoid processing oversized videos
2. **Gemini File API**: Uses efficient file upload instead of base64 encoding
3. **File size limits**: Enforces 50MB maximum for compressed videos to stay well within edge function memory limits (~140MB)
4. **Service Role Access**: Uses Supabase service role key to directly access private bucket files

## Error Codes

The function may return the following error codes:

- `NO_ANALYSIS_RESULTS`: All videos failed to process (check size and format)
- `FUNCTION_ERROR`: Unexpected error in the function (check logs for details)
