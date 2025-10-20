# Workout Plan System - Implementation Summary

## Overview

The Calos app has been transformed from a manual workout logging system to a comprehensive plan-based training platform. Users can now upload PDF workout plans, follow interactive guided workouts with rest timers, and track their progress against their scheduled training program.

## Key Features Implemented

### 1. **Database Schema**

- **Plans Table**: Stores workout plans with name, description, workouts (JSONB), schedule (JSONB), plan type (repeat/once), and tracking fields
- **Updated Workouts Table**: Added fields for plan tracking (plan_id, plan_workout_letter, scheduled_date, start_time, end_time)
- **Storage Buckets**: Created `workout-plans` bucket for PDF storage
- **Indexes & Constraints**: Comprehensive indexing for performance, unique constraint ensuring one active plan per user

### 2. **PDF Analysis with AI**

- **Supabase Edge Function**: `analyze-workout-plan` processes uploaded PDFs
- **Google Gemini AI Integration**: Extracts workout structure, exercises, sets, reps, rest times, and weekly schedules
- **Smart Parsing**: Handles various PDF formats and creates structured plan data

### 3. **Plan Management**

- **Create Plans**: Upload PDF and automatically create structured workout plan
- **Active Plan Tracking**: One active plan per user (can be repeat or one-time)
- **Schedule Calculation**: Intelligent date-based workout scheduling with mid-week start support
- **Plan Types**:
  - `repeat`: Cycles infinitely through weeks
  - `once`: Completes after specified weeks

### 4. **Interactive Workout Sessions**

- **Full-Screen Experience**: Immersive workout mode without bottom tabs
- **Running Stopwatch**: Displays elapsed time throughout entire workout
- **Set-by-Set Tracking**: Guide through each exercise and set
- **Rest Timers**: Automatic countdown with skip option
- **Rep Input**: Pre-filled with target reps, editable for actual performance
- **Progress Indicators**: Visual feedback on exercise and set progress
- **Duration Tracking**: Records start_time and end_time for each workout

### 5. **Record Page Redesign**

- **Default View**:
  - No plan: "Create your first workout plan" prompt
  - Active plan: Today's scheduled workout
- **Three-Dot Menu**: Access to:
  - Create Workout Manually (video upload or manual entry)
  - Create New Plan (upload new PDF)
- **Late Workout Warnings**: "You were supposed to do this workout X days ago"

### 6. **Enhanced Workout Display**

- **Duration Badge**: Shows workout duration (e.g., "45 min", "1h 15min")
- **Plan Badge**: Displays plan name and workout letter (e.g., "Push Day - Workout A")
- **Improved Stats**: Integrated duration alongside sets, reps, and exercises

### 7. **Plan Management Screen**

- View complete plan details
- See all workouts (A, B, C, etc.) with exercises
- View weekly schedule
- Deactivate or delete plans

## File Structure

### New Files Created

```
lib/
├── utils/
│   ├── schedule.ts          # Date/schedule calculation utilities
│   └── timer.ts              # Rest timer & stopwatch hooks
├── functions/
│   └── planFunctions.ts      # Plan CRUD operations
└── database/
    └── migrations/
        └── 008_workout_plans.sql  # Consolidated migration

components/
└── record/
    ├── CreatePlanPrompt.tsx   # PDF upload interface
    └── TodaysWorkout.tsx      # Display scheduled workout

app/
├── workout-session.tsx        # Interactive workout page
└── plan-management.tsx        # Plan details & management

supabase/
└── functions/
    └── analyze-workout-plan/
        ├── index.ts           # PDF analysis Edge Function
        └── README.md          # Setup documentation
```

### Modified Files

- `lib/database/schema.sql` - Added plans table and workout fields
- `lib/functions/workoutFunctions.ts` - Added plan tracking support
- `app/(tabs)/record.tsx` - Complete redesign for plan-based system
- `components/you/workouts/WorkoutCard.tsx` - Added duration and plan badges
- `components/you/Workouts.tsx` - Updated to fetch and display plan data

## How It Works

### Plan Creation Flow

1. User uploads PDF on record page
2. PDF stored in `workout-plans` bucket
3. Edge Function downloads and analyzes PDF with Gemini AI
4. Structured plan data created in database
5. Plan activated with today's date as start_date

### Workout Execution Flow

1. User sees today's scheduled workout on record page
2. Clicks "Start Workout" → navigates to full-screen session
3. Stopwatch starts automatically
4. For each exercise:
   - Shows exercise name, target sets/reps
   - User enters actual reps for each set
   - Rest timer activates between sets (skippable)
5. After final set, workout saves with:
   - All completed reps
   - Link to plan and workout letter
   - Start time and end time
   - Scheduled date for tracking adherence

### Schedule Calculation

The system intelligently calculates which workout to do based on:

- Plan start date
- Number of weeks in plan
- Weekly schedule array
- Plan type (repeat vs once)
- Current date

Mid-week starts are fully supported - if you start on Wednesday, that becomes day 0 of your plan.

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply migration to create plans table and update workouts
supabase db push
```

Or run the migration file manually in your Supabase dashboard.

### 2. Set Up Gemini API

1. Get API key from https://ai.google.dev/
2. Set as Supabase secret:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_key_here
   ```

### 3. Deploy Edge Function

```bash
supabase functions deploy analyze-workout-plan
```

### 4. Install Dependencies

```bash
npm install expo-document-picker @google/generative-ai
```

## Usage Guide

### For Users

1. **Creating a Plan**:
   - Open Record tab
   - Tap "Upload PDF Plan"
   - (Optional) Add AI instructions to guide the analysis
   - Select workout plan PDF
   - Wait for AI analysis
   - Plan activated automatically

2. **Following a Plan**:
   - Open Record tab daily
   - View today's scheduled workout
   - Tap "Start Workout"
   - Complete each exercise and set
   - Tap "Finish Workout" when done

3. **Manual Workouts**:
   - Tap three-dot menu in Record tab
   - Select "Create Workout Manually"
   - Use video upload or manual entry
   - Workout saved without plan link

### For Developers

**Accessing Plan Data**:

```typescript
import {
  getActivePlan,
  getTodaysWorkout,
} from "../lib/functions/planFunctions";

const plan = await getActivePlan(userId);
const todaysWorkout = getTodaysWorkout(plan);
```

**Schedule Calculations**:

```typescript
import {
  getScheduledWorkoutForDate,
  calculateDaysSinceScheduled,
} from "../lib/utils/schedule";

const workoutLetter = getScheduledWorkoutForDate(
  startDate,
  schedule,
  numWeeks,
  planType
);
```

**Timer Hooks**:

```typescript
import { useCountdownTimer, useStopwatch } from "../lib/utils/timer";

// Rest timer
const { timeLeft, start, skip, formattedTime } = useCountdownTimer(60);

// Stopwatch
const { elapsedTime, formattedTime } = useStopwatch(true);
```

## Data Models

### Plan Schema

```typescript
{
  plan_id: UUID,
  user_id: UUID,
  name: string,
  description: string,
  is_active: boolean,
  plan_type: 'repeat' | 'once',
  num_weeks: number,
  workouts: {
    [letter: string]: {
      name: string,
      exercises: {
        exercise_name: string,
        sets: number,
        reps: number,
        rest_seconds: number
      }[]
    }
  },
  schedule: string[][],  // e.g., [["A", "rest", "B", ...], ...]
  start_date: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Workout Updates

```typescript
{
  // Existing fields...
  plan_id: UUID | null,
  plan_workout_letter: string | null,
  scheduled_date: timestamp | null,
  start_time: timestamp | null,
  end_time: timestamp | null
}
```

## Future Enhancements

Potential improvements for future iterations:

1. **Progress Tracking**: Compare actual vs target reps over time
2. **Plan Templates**: Pre-built plans users can activate
3. **Progressive Overload**: Automatic weight/rep increases
4. **Workout History**: Detailed view of past plan workouts
5. **Plan Editing**: Modify exercises, sets, reps in-app
6. **Multiple Plans**: Switch between different training programs
7. **Plan Sharing**: Share plans with other users
8. **Voice Commands**: Hands-free workout navigation

## Troubleshooting

### PDF Analysis Fails

- Ensure Gemini API key is set correctly
- Check PDF contains clear workout structure
- Try simpler PDF format with tables

### Workouts Not Appearing

- Verify plan is active (`is_active = true`)
- Check start_date is set correctly
- Ensure schedule array matches num_weeks

### Duration Not Showing

- Confirm start_time and end_time were saved
- Check WorkoutCard receives plan data

## Testing

### Test PDF Analysis Locally

```bash
supabase functions serve analyze-workout-plan
curl -X POST http://localhost:54321/functions/v1/analyze-workout-plan \
  -H "Content-Type: application/json" \
  -d '{"pdfUrl": "your-test-pdf-url"}'
```

### Test Schedule Calculations

Create unit tests for schedule utilities to ensure proper week/day calculations.

## Performance Considerations

- Plans table indexed on `user_id` and `is_active`
- Workouts indexed on `plan_id` and `scheduled_date`
- PDF analysis runs server-side to avoid mobile performance impact
- Lazy loading implemented for workout history

## Security

- RLS policies ensure users only access their own plans
- PDF storage restricted to user's folder
- Edge Function validates user authentication
- All plan operations require user ownership verification

---

**Status**: ✅ Fully Implemented

**Version**: 1.0.0

**Last Updated**: October 2025
