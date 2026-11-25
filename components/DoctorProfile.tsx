import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api, money } from "../lib/api";
import type { Doctor } from "../lib/types";
import { useAuth } from "../lib/auth";
import { Card } from "./ui";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DoctorProfile() {
  const { user, logout } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Doctor>("/doctor/me")
      .then((d) => setDoctor(d))
      .catch((e) => console.warn("Failed to fetch doctor profile:", e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e: any) {
      Alert.alert("Error signing out", e.message);
    }
  };

  const contactAdmin = () => {
    const url = "tel:0700000000";
    Linking.canOpenURL(url).then((ok) => {
      if (ok) Linking.openURL(url);
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#065f46" />
      </View>
    );
  }

  const initials = (doctor?.full_name || user?.full_name || "Doctor")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Hero header */}
        <View
          style={{
            backgroundColor: "#065f46",
            paddingTop: 56,
            paddingBottom: 48,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: "#059669",
              borderWidth: 3,
              borderColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}>{initials}</Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 12 }}>
            Dr. {doctor?.full_name || user?.full_name}
          </Text>
          <Text style={{ color: "#a7f3d0", fontSize: 14, marginTop: 4 }}>
            {doctor?.specialty || "Specialist Doctor"}
          </Text>
          <View
            style={{
              marginTop: 10,
              backgroundColor: "#ecfdf5",
              paddingHorizontal: 14,
              paddingVertical: 4,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: "#065f46", fontSize: 12, fontWeight: "800" }}>
              DOCTOR PORTAL
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -20, gap: 14 }}>
          {/* Clinical Details Card */}
          <Card>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 12 }}>
              Clinical Practice Info
            </Text>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontSize: 14 }}>Specialty</Text>
                <Text style={{ fontWeight: "700", color: "#0f172a", fontSize: 14 }}>
                  {doctor?.specialty || "General Specialty"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontSize: 14 }}>Hospital Location</Text>
                <Text style={{ fontWeight: "700", color: "#0f172a", fontSize: 14 }}>
                  {doctor?.hospital_location || "Main Clinic"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontSize: 14 }}>Consultation Fee</Text>
                <Text style={{ fontWeight: "700", color: "#059669", fontSize: 14 }}>
                  {doctor ? money(doctor.consultation_fee) : "—"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontSize: 14 }}>Slot Length</Text>
                <Text style={{ fontWeight: "700", color: "#0f172a", fontSize: 14 }}>
                  {doctor?.slot_minutes || 20} minutes per patient
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontSize: 14 }}>Max Daily Capacity</Text>
                <Text style={{ fontWeight: "700", color: "#0f172a", fontSize: 14 }}>
                  {doctor?.max_daily_appointments || 20} patients/day
                </Text>
              </View>
            </View>
          </Card>

          {/* Visiting Schedule Days */}
          <Card>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 8 }}>
              Active Clinic Days
            </Text>
            <Text style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
              Days when visiting slots are generated for patient bookings.
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {doctor?.working_days && doctor.working_days.length > 0 ? (
                doctor.working_days.map((w) => (
                  <View
                    key={w}
                    style={{
                      backgroundColor: "#ecfdf5",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#a7f3d0",
                    }}
                  >
                    <Text style={{ color: "#065f46", fontSize: 13, fontWeight: "700" }}>
                      {WEEKDAYS[w] || `Day ${w}`}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: "#94a3b8", fontSize: 13 }}>No visiting days configured yet.</Text>
              )}
            </View>
          </Card>

          {/* Account & Contact */}
          <Card>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 10 }}>
              Account & Credentials
            </Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#64748b", fontSize: 14 }}>Registered Phone</Text>
                <Text style={{ fontWeight: "600", color: "#0f172a", fontSize: 14 }}>
                  {user?.phone || "—"}
                </Text>
              </View>
              {user?.email && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#64748b", fontSize: 14 }}>Email</Text>
                  <Text style={{ fontWeight: "600", color: "#0f172a", fontSize: 14 }}>
                    {user.email}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Administration Hotline */}
          <Card>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0f172a", marginBottom: 4 }}>
              Hospital Administration
            </Text>
            <Text style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>
              Need to adjust your visiting hours, consultation fee, or request time off? Contact hospital admin.
            </Text>
            <Pressable
              onPress={contactAdmin}
              style={{
                backgroundColor: "#f8fafc",
                borderWidth: 1.5,
                borderColor: "#e2e8f0",
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#065f46", fontWeight: "700", fontSize: 14 }}>
                Contact Hospital Admin
              </Text>
            </Pressable>
          </Card>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#fff1f2",
              borderWidth: 1.5,
              borderColor: "#fecaca",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text style={{ color: "#dc2626", fontWeight: "800", fontSize: 15 }}>
              Sign out from Doctor Portal
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
