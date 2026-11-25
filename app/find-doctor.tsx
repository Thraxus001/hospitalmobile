import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { api, money } from "../lib/api";
import type { Department, Doctor } from "../lib/types";
import { Card } from "../components/ui";
import { getDepartmentImage } from "../lib/departmentImages";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function FindDoctor() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleReturn = () => {
    try {
      if (Platform.OS !== "web" && router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      router.replace("/(tabs)");
    }
  };

  // Load departments for filter chips
  useEffect(() => {
    api<Department[]>("/patient/departments")
      .then((data) => setDepartments(data))
      .catch(() => {});
  }, []);

  // Fetch doctors based on search & specialty
  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDept && selectedDept !== "All") {
        params.append("specialty", selectedDept);
      }
      if (q.trim()) {
        params.append("q", q.trim());
      }
      const queryString = params.toString() ? `?${params.toString()}` : "";
      const docs = await api<Doctor[]>(`/doctors${queryString}`);
      setDoctors(docs);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load doctors");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDoctors();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadDoctors]);

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#065f46",
          paddingTop: 52,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={handleReturn}
          accessibilityRole="button"
          activeOpacity={0.75}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
            gap: 6,
            alignSelf: "flex-start",
            paddingVertical: 6,
            paddingHorizontal: 8,
            marginLeft: -8,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#a7f3d0", fontSize: 26, fontWeight: "400", lineHeight: 26 }}>
            ‹
          </Text>
          <Text style={{ color: "#a7f3d0", fontSize: 15, fontWeight: "700" }}>
            Back to Home
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            color: "#fff",
            fontSize: 26,
            fontWeight: "800",
            letterSpacing: -0.5,
          }}
        >
          Find a Doctor
        </Text>
        <Text style={{ color: "#a7f3d0", fontSize: 14, marginTop: 4 }}>
          Search qualified specialists & book your consultation
        </Text>

        {/* Search input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            borderRadius: 14,
            marginTop: 16,
            paddingHorizontal: 16,
            height: 48,
          }}
        >
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by doctor name, specialty, or clinic..."
            placeholderTextColor="#94a3b8"
            style={{ flex: 1, fontSize: 15, color: "#0f172a" }}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ("")} hitSlop={10}>
              <Text style={{ color: "#94a3b8", fontSize: 16, padding: 4 }}>
                ✕
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Department Filter Chips */}
      <View style={{ backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 0, name: "All", icon: null, active: true, doctor_count: 0 }, ...departments]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = selectedDept === item.name;
            const deptImg = getDepartmentImage(item.name);
            return (
              <TouchableOpacity
                onPress={() => setSelectedDept(item.name)}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: isSelected ? "#059669" : "#e2e8f0",
                  backgroundColor: isSelected ? "#ecfdf5" : "#f8fafc",
                  gap: 6,
                }}
              >
                {deptImg ? (
                  <Image
                    source={deptImg}
                    style={{ width: 18, height: 18, borderRadius: 9 }}
                    resizeMode="cover"
                  />
                ) : null}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? "#059669" : "#475569",
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Doctor List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 40 }}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>
            Searching specialists…
          </Text>
        </View>
      ) : error ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text style={{ color: "#dc2626", fontWeight: "600", fontSize: 15 }}>
            {error}
          </Text>
          <Pressable
            onPress={loadDoctors}
            style={{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: "#059669",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={doctors ?? []}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 36 }}
          ListHeaderComponent={
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#64748b" }}>
                {doctors?.length ?? 0} SPECIALIST{(doctors?.length ?? 0) === 1 ? "" : "S"} FOUND
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 24 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1e293b",
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                No doctors found
              </Text>
              <Text
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {q
                  ? `No matching specialists for "${q}". Try a different name or specialty.`
                  : "No doctors currently available in this specialty."}
              </Text>
            </View>
          }
          renderItem={({ item: d }) => (
            <Card className="p-4">
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>
                    {d.full_name}
                  </Text>
                  <Text style={{ color: "#059669", fontWeight: "600", fontSize: 14, marginTop: 2 }}>
                    {d.specialty}
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
                    {d.hospital_location}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
                    {money(d.consultation_fee)}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#d97706", fontWeight: "700", marginTop: 2 }}>
                    {d.rating.toFixed(1)} / 5.0
                  </Text>
                  {d.has_slots_today ? (
                    <View
                      style={{
                        marginTop: 4,
                        backgroundColor: "#ecfdf5",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#a7f3d0",
                      }}
                    >
                      <Text style={{ color: "#047857", fontSize: 11, fontWeight: "700" }}>
                        Free today
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        marginTop: 4,
                        backgroundColor: "#f1f5f9",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>
                        Check slots
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Working days & duration */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 12,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: "#f1f5f9",
                }}
              >
                <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "600" }}>
                  Days:
                </Text>
                {d.working_days.map((w) => (
                  <View
                    key={w}
                    style={{
                      backgroundColor: "#f0fdf4",
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: "#bbf7d0",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#166534" }}>
                      {WEEK[w]}
                    </Text>
                  </View>
                ))}
                <Text style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
                  {d.slot_minutes} min visits
                </Text>
              </View>

              {/* Book session button */}
              <TouchableOpacity
                onPress={() => router.push(`/doctor/${d.id}`)}
                activeOpacity={0.85}
                style={{
                  marginTop: 14,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "#059669",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                  Book Session
                </Text>
                <Text style={{ color: "#fff", fontSize: 14 }}>→</Text>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}
    </View>
  );
}
