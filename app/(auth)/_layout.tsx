import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f1f5f9" },
        animation: "slide_from_right",
      }}
    />
  );
}
