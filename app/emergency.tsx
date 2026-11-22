import {
  View,
  Text,
  Pressable,
  StatusBar,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

const EMERGENCY_LINES = [
  { label: "Ambulance / Police", number: "999" },
  { label: "Kenya Red Cross", number: "1199" },
  { label: "AMREF Air Rescue", number: "+254 20 6000 090" },
];

export default function Emergency() {
  const router = useRouter();

  const call = (number: string) => {
    const url = `tel:${number.replace(/\s/g, "")}`;
    Linking.canOpenURL(url)
      .then((ok) => {
        if (ok) return Linking.openURL(url);
        Alert.alert("Cannot call", "Please dial " + number + " manually.");
      })
      .catch(() => Alert.alert("Cannot call", "Please dial " + number + " manually."));
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff1f2" }}>
      <StatusBar barStyle="light-content" />

      {/* Red header */}
      <View
        style={{
          backgroundColor: "#991b1b",
          paddingTop: 56,
          paddingBottom: 32,
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 6 }}
        >
          <Text style={{ color: "#fca5a5", fontSize: 24, fontWeight: "300" }}>‹</Text>
          <Text style={{ color: "#fca5a5", fontSize: 15, fontWeight: "600" }}>Back</Text>
        </Pressable>
        <Text style={{ color: "#fca5a5", fontSize: 13, fontWeight: "600" }}>URGENT</Text>
        <Text
          style={{
            color: "#fff",
            fontSize: 26,
            fontWeight: "800",
            marginTop: 4,
            letterSpacing: -0.5,
          }}
        >
          Emergency
        </Text>
        <Text style={{ color: "#fecaca", fontSize: 14, marginTop: 4 }}>
          Tap a number below to call immediately
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Warning banner */}
        <View
          style={{
            backgroundColor: "#fee2e2",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1.5,
            borderColor: "#fca5a5",
          }}
        >
          <Text
            style={{
              color: "#7f1d1d",
              fontWeight: "700",
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            If this is a life-threatening emergency, call an ambulance
            immediately. Do not wait for an appointment.
          </Text>
        </View>

        {/* Emergency lines */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#374151",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Emergency contacts
        </Text>
        {EMERGENCY_LINES.map((line) => (
          <Pressable
            key={line.number}
            onPress={() => call(line.number)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 18,
              marginBottom: 10,
              borderWidth: 1.5,
              borderColor: "#fee2e2",
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 15, color: "#0f172a" }}>
                {line.label}
              </Text>
              <Text style={{ color: "#dc2626", fontSize: 18, fontWeight: "800", marginTop: 2 }}>
                {line.number}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#fee2e2",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#dc2626" }}>
                Call
              </Text>
            </View>
          </Pressable>
        ))}

        {/* Book urgent appointment */}
        <View
          style={{
            height: 1,
            backgroundColor: "#fee2e2",
            marginVertical: 20,
          }}
        />
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#374151",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Need urgent care?
        </Text>
        <Pressable
          onPress={() => router.push("/find-doctor")}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 16,
            backgroundColor: "#dc2626",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
            shadowColor: "#dc2626",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
            Book an Urgent Appointment
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16, alignItems: "center", padding: 10 }}
        >
          <Text style={{ color: "#64748b", fontSize: 14 }}>← Back to Home</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
