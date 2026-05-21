import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#fafaf9" },
          headerTintColor: "#1c1917",
          headerTitleStyle: { fontWeight: "600" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: "Scan a Book", presentation: "modal" }} />
        <Stack.Screen name="book/[id]" options={{ title: "Book Details" }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
