import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/query-client.js";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#090d16",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: "#090d16",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "MediaFriend 🏑",
            headerLargeTitle: false,
          }}
        />
        <Stack.Screen
          name="create"
          options={{
            title: "Skapa Matchplansch",
            headerBackTitle: "Tillbaka",
          }}
        />
        <Stack.Screen
          name="club"
          options={{
            title: "Föreningsprofil",
            headerBackTitle: "Tillbaka",
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
