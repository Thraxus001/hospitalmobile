import { Platform, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { useAuth } from "../../lib/auth";

export default function TabsLayout() {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";

  const renderLabel = (label: string, focused: boolean, color: string) => (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: focused ? "#ecfdf5" : "transparent",
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color,
          fontSize: 13,
          fontWeight: focused ? "800" : "600",
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#64748b",
        tabBarShowLabel: true,
        tabBarIcon: () => null,
        tabBarIconStyle: { display: "none" },
        sceneStyle: { backgroundColor: "#f1f5f9" },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 78 : 58,
          paddingTop: 4,
          paddingBottom: Platform.OS === "ios" ? 20 : 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isDoctor ? "Dashboard" : "Home",
          tabBarLabel: ({ focused, color }) =>
            renderLabel(isDoctor ? "Dashboard" : "Home", focused, color),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: isDoctor ? "Schedule" : "Appointments",
          tabBarLabel: ({ focused, color }) =>
            renderLabel(isDoctor ? "Schedule" : "Appointments", focused, color),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isDoctor ? "My Profile" : "Profile",
          tabBarLabel: ({ focused, color }) =>
            renderLabel(isDoctor ? "Doctor" : "Profile", focused, color),
        }}
      />
    </Tabs>
  );
}
