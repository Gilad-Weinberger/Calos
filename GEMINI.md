# Calos Project Gemini Guide

This document provides a comprehensive overview of the Calos project, its architecture, and key development conventions. It is intended to be used as a guide for developers and AI assistants working on the project.

## Project Overview

Calos is a comprehensive fitness tracking app that helps users plan, record, and analyze their workouts with AI-powered insights and social features. It is a cross-platform mobile application built with **React Native** and **Expo**, with a backend powered by **Supabase**. The app leverages **Google Gemini AI** for intelligent features like personalized workout plan generation and PDF plan analysis.

### Key Technologies

-   **Frontend**: React Native, Expo, TypeScript, NativeWind (Tailwind CSS for React Native)
-   **Backend**: Supabase (PostgreSQL, Authentication, Storage, Edge Functions)
-   **AI**: Google Gemini 2.5 Flash
-   **Navigation**: Expo Router (file-based routing)
-   **State Management**: React Context, custom hooks
-   **Analytics**: PostHog

### Architecture

-   **Cross-Platform**: The app is built with Expo, allowing it to be deployed on both iOS and Android from a single codebase.
-   **Serverless Backend**: Supabase provides a complete backend-as-a-service, including a database, authentication, file storage, and serverless functions.
-   **AI-Powered Features**: The app integrates with Google Gemini AI via Supabase Edge Functions to provide intelligent features.
-   **Component-Based UI**: The UI is built with React and organized into reusable components.
-   **File-Based Routing**: Navigation is handled by Expo Router, which uses a file-based routing system similar to Next.js.

## Building and Running

The project uses `npm` as its package manager. The following scripts are available in `package.json`:

-   **`npm start`**: Starts the Expo development server.
-   **`npm run android`**: Runs the app on an Android emulator or connected device.
-   **`npm run ios`**: Runs the app on an iOS simulator or connected device.
-   **`npm run web`**: Runs the app in a web browser.
-   **`npm run lint`**: Lints the codebase using ESLint.

### Environment Variables

The app uses environment variables to configure the Supabase client. These variables are stored in a `.env` file and are loaded by Expo. The following variables are required:

-   `EXPO_PUBLIC_SUPABASE_URL`: The URL of the Supabase project.
-   `EXPO_PUBLIC_SUPABASE_KEY`: The publishable key for the Supabase project.

The Supabase Edge Functions require the following environment variables:

-   `GEMINI_API_KEY`: The API key for the Google Gemini AI.
-   `SUPABASE_URL`: The URL of the Supabase project.
-   `SUPABASE_SERVICE_ROLE_KEY`: The service role key for the Supabase project.
-   `POSTHOG_API_KEY`: The API key for PostHog analytics.

## Development Conventions

### Code Style

The project uses **ESLint** and **Prettier** to enforce a consistent code style. The ESLint configuration is located in `eslint.config.js` and the Prettier configuration is part of the `prettier-plugin-tailwindcss` package.

### File Structure

The project follows a feature-based file structure. The `app` directory contains all the screens and routes, organized by feature. The `components` directory contains reusable UI components, also organized by feature. The `lib` directory contains shared code, such as context providers, hooks, and utility functions.

### Authentication

Authentication is handled by the `AuthContext` provider, which uses Supabase Authentication. The `useAuth` hook provides access to the user's authentication state and functions for signing in, signing out, and managing the user's profile.

### AI Integration

The AI features are implemented as Supabase Edge Functions. These functions are written in TypeScript and use the Google Gemini AI SDK to generate workout plans and analyze PDF files. The `generate-ai-workout-plan` function is a good example of how to use the Gemini AI to generate a personalized workout plan.

### State Management

The project uses a combination of React Context and custom hooks for state management. The `AuthContext` is a good example of how to use React Context to manage global state. The `useWorkoutSession` hook is a good example of how to use a custom hook to manage complex state for a specific feature.

### UI Components

The UI is built with a combination of standard React Native components and custom components. The project uses **NativeWind** to style the components with Tailwind CSS classes. The `components` directory contains a library of reusable UI components that can be used to build new screens.
