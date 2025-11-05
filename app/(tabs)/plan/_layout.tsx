import { Stack } from "expo-router";
import React from "react";

export default function PlanLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="overview/[weekIndex]" />
    </Stack>
  );
}
