import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "../../lib/api";
import type { Department } from "../../lib/types";
import { useAuth } from "../../lib/auth";
import { getDepartmentImage } from "../../lib/departmentImages";

// Department background colours keyed by department name
const DEPT_BG: Record<string, string> = {
  Cardiology: "#fef2f2",
  Dermatology: "#f0fdf4",
  Neurology: "#faf5ff",
  Orthopedics: "#fffbeb",
  Pediatrics: "#fff7ed",
  "General Medicine": "#eff6ff",
  Oncology: "#f0fdfa",
  Ophthalmology: "#fdf4ff",
  ENT: "#fefce8",
  Gynecology: "#f8fafc",
};

const DEPT_ACCENT: Record<string, string> = {
  Cardiology: "#ef4444",
  Dermatology: "#10b981",
  Neurology: "#8b5cf6",
  Orthopedics: "#f59e0b",
  Pediatrics: "#f97316",
  "General Medicine": "#3b82f6",
  Oncology: "#14b8a6",
  Ophthalmology: "#d946ef",
  ENT: "#eab308",
  Gynecology: "#64748b",
};

// Quick-access feature cards — each has a distinct working route
const FEATURES = [
  {
    label: "Find a\nDoctor",
    color: "#ecfdf5",
    text: "#065f46",
    route: "/find-doctor" as const,
    description: "Search all specialists",
  },
  {
    label: "My\nAppointments",
    color: "#eff6ff",
    text: "#1e40af",
    route: "/(tabs)/appointments" as const,
    description: "View & reschedule",
  },
  {
    label: "Lab\nResults",
    color: "#fdf4ff",
    text: "#7e22ce",
    route: "/lab-results" as const,
    description: "Health test records",
  },
  {
    label: "Emergency",
    color: "#fef2f2",
    text: "#991b1b",
    route: "/emergency" as const,
    description: "Urgent ambulance & care",
  },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const depts = await api<Department[]>("/patient/departments");
      setDepartments(depts);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    departments?.filter((d) =>
      d.name.toLowerCase().includes(q.toLowerCase())
    ) ?? null;

  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Hero Header ── */}
        <View
          style={{
            backgroundColor: "#0f4c81",
            paddingTop: 56,
            paddingBottom: 72,
            paddingHorizontal: 24,
          }}
        >
          <Image
            source={require("../../assets/icons/logo.png")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              marginBottom: 16,
            }}
            resizeMode="contain"
          />
          <Text style={{ color: "#93c5fd", fontSize: 14, fontWeight: "600" }}>
            {greeting},
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 26,
              fontWeight: "800",
              marginTop: 2,
              letterSpacing: -0.5,
            }}
          >
            {firstName}
          </Text>
          <Text style={{ color: "#bfdbfe", fontSize: 14, marginTop: 4 }}>
            How can we help you today?
          </Text>

          {/* Search bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 16,
              marginTop: 20,
              paddingHorizontal: 16,
              height: 50,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search departments or specialties…"
              placeholderTextColor="#94a3b8"
              style={{ flex: 1, fontSize: 15, color: "#0f172a" }}
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ("")} hitSlop={10}>
                <Text style={{ color: "#94a3b8", fontSize: 18, padding: 4 }}>
                  ✕
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Banner image card ── */}
        <View style={{ marginHorizontal: 20, marginTop: -40 }}>
          <Pressable
            onPress={() => router.push("/find-doctor")}
            style={({ pressed }) => ({
              borderRadius: 20,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 20,
              elevation: 12,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Image
              source={require("../../assets/doctor-banner.png")}
              style={{ width: "100%", height: 160, backgroundColor: "#0369a1" }}
              resizeMode="cover"
            />
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#0369a1bb",
                padding: 20,
                justifyContent: "flex-end",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
                Book a Specialist Today
              </Text>
              <Text style={{ color: "#bae6fd", fontSize: 13, marginTop: 4 }}>
                Find verified doctors · Flexible slots · Tap to browse →
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── Quick Access ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: "#0f172a",
              }}
            >
              Quick access
            </Text>
            <Pressable onPress={() => router.push("/find-doctor")}>
              <Text style={{ color: "#059669", fontWeight: "700", fontSize: 13 }}>
                All Doctors →
              </Text>
            </Pressable>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {FEATURES.map((f) => (
              <Pressable
                key={f.label}
                onPress={() => router.push(f.route)}
                style={({ pressed }) => ({
                  width: "48%",
                  backgroundColor: f.color,
                  borderRadius: 16,
                  padding: 16,
                  opacity: pressed ? 0.8 : 1,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.03)",
                })}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: f.text,
                    lineHeight: 18,
                  }}
                >
                  {f.label}
                </Text>
                <Text
                  style={{ fontSize: 11, color: "#64748b", fontWeight: "500" }}
                >
                  {f.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Departments ── */}
        <View style={{ marginTop: 28, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <View>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>
                Departments
              </Text>
              <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Pick a department to view care details & specialists
              </Text>
            </View>
            {departments && (
              <Text style={{ fontSize: 13, color: "#64748b" }}>
                {departments.length} total
              </Text>
            )}
          </View>

          {error ? (
            <View
              style={{
                backgroundColor: "#fef2f2",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: "#fecaca",
              }}
            >
              <Text style={{ color: "#dc2626", fontWeight: "600" }}>
                Could not load departments
              </Text>
              <Text style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>
                {error}
              </Text>
              <Pressable onPress={load} style={{ marginTop: 10 }}>
                <Text style={{ color: "#059669", fontWeight: "700" }}>
                  Retry →
                </Text>
              </Pressable>
            </View>
          ) : !filtered ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator color="#059669" size="large" />
              <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 14 }}>
                Loading departments…
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Text style={{ color: "#334155", fontWeight: "700", fontSize: 15 }}>
                No departments found for "{q}"
              </Text>
              <Pressable
                onPress={() => router.push("/find-doctor")}
                style={{
                  marginTop: 10,
                  backgroundColor: "#059669",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                  Search all doctors instead
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {filtered.map((dept) => {
                const bg = DEPT_BG[dept.name] ?? "#f8fafc";
                const accent = DEPT_ACCENT[dept.name] ?? "#64748b";
                const deptImg = getDepartmentImage(dept.name);
                return (
                  <Pressable
                    key={dept.id}
                    onPress={() =>
                      router.push(
                        `/department/${encodeURIComponent(dept.name)}`
                      )
                    }
                    style={({ pressed }) => ({
                      width: "48%",
                      backgroundColor: bg,
                      borderRadius: 18,
                      padding: 16,
                      minHeight: 130,
                      opacity: pressed ? 0.8 : 1,
                      borderWidth: 1,
                      borderColor: `${accent}22`,
                      shadowColor: accent,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 2,
                    })}
                  >
                    {deptImg ? (
                      <Image
                        source={deptImg}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          marginBottom: 8,
                        }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Text
                      style={{
                        marginTop: deptImg ? 0 : 4,
                        fontWeight: "800",
                        fontSize: 14,
                        color: "#0f172a",
                        lineHeight: 18,
                      }}
                    >
                      {dept.name}
                    </Text>
                    <View
                      style={{
                        marginTop: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: accent,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          fontWeight: "600",
                        }}
                      >
                        {dept.doctor_count}{" "}
                        {dept.doctor_count === 1 ? "doctor" : "doctors"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
