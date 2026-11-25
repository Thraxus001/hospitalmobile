import { View, Text, Pressable, StatusBar, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function LabResults() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#4c1d95",
          paddingTop: 56,
          paddingBottom: 32,
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            gap: 6,
          }}
        >
          <Text style={{ color: "#c4b5fd", fontSize: 24, fontWeight: "300" }}>‹</Text>
          <Text style={{ color: "#c4b5fd", fontSize: 15, fontWeight: "600" }}>Back</Text>
        </Pressable>
        <Text style={{ color: "#c4b5fd", fontSize: 13, fontWeight: "600" }}>RECORDS</Text>
        <Text
          style={{
            color: "#fff",
            fontSize: 26,
            fontWeight: "800",
            marginTop: 4,
            letterSpacing: -0.5,
          }}
        >
          Lab Results
        </Text>
        <Text style={{ color: "#ddd6fe", fontSize: 14, marginTop: 4 }}>
          Your test results and health records
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: "#1e1b4b",
            textAlign: "center",
            marginTop: 40,
            marginBottom: 10,
          }}
        >
          Coming Soon
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#64748b",
            textAlign: "center",
            lineHeight: 22,
            maxWidth: 300,
            marginBottom: 36,
          }}
        >
          Lab results and health records will be available here. Your doctor
          can share test results directly to your account.
        </Text>

        {/* Features preview */}
        {[
          { label: "Blood test results" },
          { label: "Imaging & X-rays" },
          { label: "Prescription history" },
          { label: "Consultation notes" },
        ].map((f) => (
          <View
            key={f.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
              width: "100%",
              borderWidth: 1,
              borderColor: "#ede9fe",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>
              {f.label}
            </Text>
            <Text style={{ marginLeft: "auto", color: "#c4b5fd", fontSize: 20 }}>›</Text>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            marginTop: 24,
            height: 50,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: "#7c3aed",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Text style={{ color: "#7c3aed", fontWeight: "700", fontSize: 15 }}>
            ← Back to Home
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
