import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from "react-native";
import { api, eatDateKey, fmtDate, fmtTime, money } from "../lib/api";
import type { Appointment, Doctor } from "../lib/types";
import { Card, StatusBadge } from "./ui";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Seen" },
  { key: "no_show", label: "No-show" },
];

export default function DoctorSchedule() {
  const [selectedDay, setSelectedDay] = useState(eatDateKey(0)); // today
  const [statusFilter, setStatusFilter] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const loadAppointments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api<Appointment[]>(`/doctor/appointments?day=${selectedDay}`);
      setAppointments(data);
    } catch (e: any) {
      console.warn("Failed to load doctor appointments:", e.message);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const actOnAppointment = async (appt: Appointment, action: "complete" | "no-show") => {
    const isNoShow = action === "no-show";
    const patientName = appt.patient?.full_name || "Patient";

    const proceed = () => {
      setActingId(appt.id);
      api<Appointment>(`/doctor/appointments/${appt.id}/${action}`, { method: "POST" })
        .then(() => {
          loadAppointments();
        })
        .catch((e: any) => {
          Alert.alert("Action failed", e.message || "Could not update appointment status.");
        })
        .finally(() => {
          setActingId(null);
        });
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        isNoShow
          ? `Mark ${patientName} as a no-show?`
          : `Mark consultation with ${patientName} as completed?`
      );
      if (confirmed) proceed();
    } else {
      Alert.alert(
        isNoShow ? "Mark No-Show?" : "Complete Consultation?",
        isNoShow
          ? `Are you sure ${patientName} did not attend this visit?`
          : `Confirm you completed the consultation with ${patientName}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: isNoShow ? "Mark No-Show" : "Mark Completed", style: isNoShow ? "destructive" : "default", onPress: proceed },
        ]
      );
    }
  };

  const callPatient = (phone: string) => {
    if (!phone) return;
    const url = `tel:${phone.replace(/\s+/g, "")}`;
    Linking.canOpenURL(url).then((ok) => {
      if (ok) Linking.openURL(url);
    });
  };

  const filtered = appointments.filter((a) => {
    if (statusFilter === "all") return true;
    return a.status === statusFilter;
  });

  const nextFewDays = [
    { label: "Today", key: eatDateKey(0) },
    { label: "Tomorrow", key: eatDateKey(1) },
    { label: "+2 Days", key: eatDateKey(2) },
    { label: "+3 Days", key: eatDateKey(3) },
    { label: "+4 Days", key: eatDateKey(4) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#065f46",
          paddingTop: 54,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ color: "#a7f3d0", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 }}>
          CLINIC SCHEDULE
        </Text>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 }}>
          Doctor Appointments
        </Text>
        <Text style={{ color: "#a7f3d0", fontSize: 13, marginTop: 4 }}>
          {appointments.length} booking{appointments.length === 1 ? "" : "s"} on {selectedDay}
        </Text>

        {/* Date Selector Row */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          {nextFewDays.map((d) => {
            const isSelected = selectedDay === d.key;
            return (
              <Pressable
                key={d.key}
                onPress={() => setSelectedDay(d.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: isSelected ? "#fff" : "rgba(255,255,255,0.18)",
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#065f46" : "#fff",
                    fontWeight: isSelected ? "800" : "600",
                    fontSize: 12,
                  }}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Status Filter Chips */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: "row",
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
        }}
      >
        {STATUS_FILTERS.map((s) => {
          const on = statusFilter === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => setStatusFilter(s.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: on ? "#ecfdf5" : "#f8fafc",
                borderWidth: 1,
                borderColor: on ? "#059669" : "#e2e8f0",
              }}
            >
              <Text
                style={{
                  color: on ? "#059669" : "#64748b",
                  fontWeight: on ? "800" : "500",
                  fontSize: 13,
                }}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Appointment List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#065f46" />
          <Text style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>Loading clinic list…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => String(a.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAppointments(true)} tintColor="#065f46" />}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#334155" }}>
                No appointments for this day
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4, textAlign: "center" }}>
                There are no scheduled patients matching this filter on {selectedDay}.
              </Text>
            </View>
          }
          renderItem={({ item: a }) => {
            const isConfirmed = a.status === "confirmed";
            return (
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
                      {a.patient?.full_name || "Patient"}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                      {fmtTime(a.start_at)} – {fmtTime(a.end_at)}
                    </Text>
                    {a.priority < 2 && (
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color: a.priority === 0 ? "#dc2626" : "#d97706",
                          marginTop: 3,
                        }}
                      >
                        {a.priority === 0 ? "EMERGENCY" : "HIGH PRIORITY"}
                      </Text>
                    )}
                  </View>
                  <StatusBadge status={a.status} />
                </View>

                {/* Patient contact row */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#f1f5f9",
                  }}
                >
                  <Text style={{ fontSize: 13, color: "#475569", fontWeight: "600" }}>
                    Phone: {a.patient?.phone || "No phone on file"}
                  </Text>
                  {a.patient?.phone && (
                    <Pressable
                      onPress={() => callPatient(a.patient!.phone)}
                      style={{
                        backgroundColor: "#ecfdf5",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#065f46", fontSize: 12, fontWeight: "700" }}>
                        Call Patient
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Actions */}
                {isConfirmed && (
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                    <Pressable
                      disabled={actingId === a.id}
                      onPress={() => actOnAppointment(a, "complete")}
                      style={{
                        flex: 1,
                        backgroundColor: "#059669",
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                        {actingId === a.id ? "Updating…" : "Mark Seen"}
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={actingId === a.id}
                      onPress={() => actOnAppointment(a, "no-show")}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: "#fee2e2",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 13 }}>
                        No-show
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}
