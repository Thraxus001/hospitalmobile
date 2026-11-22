import { Platform, Text, View } from "react-native";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#64748b",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 82 : 62,
          paddingTop: 4,
          paddingBottom: Platform.OS === "ios" ? 22 : 4,
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
          title: "Home",
          tabBarLabel: ({ focused, color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: focused ? "#ecfdf5" : "transparent",
              }}
            >
              <Text
                style={{
                  color,
                  fontSize: 15,
                  fontWeight: focused ? "800" : "600",
                  letterSpacing: 0.3,
                }}
              >
                Home
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Appointments",
          tabBarLabel: ({ focused, color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: focused ? "#ecfdf5" : "transparent",
              }}
            >
              <Text
                style={{
                  color,
                  fontSize: 15,
                  fontWeight: focused ? "800" : "600",
                  letterSpacing: 0.3,
                }}
              >
                Appointments
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: ({ focused, color }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: focused ? "#ecfdf5" : "transparent",
              }}
            >
              <Text
                style={{
                  color,
                  fontSize: 15,
                  fontWeight: focused ? "800" : "600",
                  letterSpacing: 0.3,
                }}
              >
                Profile
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
