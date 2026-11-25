import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api, fmtDate, fmtTime, money } from "../lib/api";
import type { Appointment, Doctor, Notif } from "../lib/types";
import { useAuth } from "../lib/auth";
import { Card, StatusBadge } from "./ui";

const countdown = (diffMins: number) => {
  if (diffMins <= 0) return "NOW";
  if (diffMins < 60) return `in ${Math.ceil(diffMins)}m`;
  const h = Math.floor(diffMins / 60);
  const m = Math.round(diffMins % 60);
  return `in ${h}h ${m}m`;
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [d, u, t, n] = await Promise.all([
        api<Doctor>("/doctor/me").catch(() => null),
        api<Appointment[]>("/doctor/upcoming?hours=24").catch(() => []),
        api<Appointment[]>("/doctor/appointments").catch(() => []),
        api<Notif[]>("/doctor/notifications").catch(() => []),
      ]);
      if (d) setDoctor(d);
      setUpcoming(u);
      setTodayAppts(t);
      setNotifications(n);
    } catch (e: any) {
      console.warn("DoctorDashboard load error:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    timerRef.current = setInterval(() => {
      setNow(Date.now());
    }, 15000);
    const pollInterval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearInterval(pollInterval);
    };
  }, [loadData]);

  const actOnAppointment = async (appt: Appointment, action: "complete" | "no-show") => {
    const isNoShow = action === "no-show";
    const patientName = appt.patient?.full_name || "Patient";

    const proceed = () => {
      setActingId(appt.id);
      api<Appointment>(`/doctor/appointments/${appt.id}/${action}`, { method: "POST" })
        .then(() => {
          loadData();
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
          : `Confirm you have completed the consultation with ${patientName}?`
      );
      if (confirmed) proceed();
    } else {
      Alert.alert(
        isNoShow ? "Mark No-Show?" : "Complete Consultation?",
        isNoShow
          ? `Are you sure ${patientName} did not attend this visit?`
          : `Mark consultation with ${patientName} as completed?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: isNoShow ? "Mark No-Show" : "Mark Completed", style: isNoShow ? "destructive" : "default", onPress: proceed },
        ]
      );
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api("/doctor/notifications/read-all", { method: "POST" });
      loadData();
    } catch {}
  };

  const callPatient = (phone: string) => {
    if (!phone) return;
    const url = `tel:${phone.replace(/\s+/g, "")}`;
    Linking.canOpenURL(url).then((ok) => {
      if (ok) Linking.openURL(url);
    });
  };

  const next = upcoming[0];
  const nextDiffMins = next ? (new Date(next.start_at).getTime() - now) / 60000 : null;
  const isSoon = nextDiffMins !== null && nextDiffMins <= 30;
  const unreadNotifs = notifications.filter((n) => !n.read_at).length;

  const completedCount = todayAppts.filter((a) => a.status === "completed").length;
  const waitingCount = todayAppts.filter((a) => a.status === "confirmed").length;
  const noShowCount = todayAppts.filter((a) => a.status === "no_show").length;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#065f46" />
        <Text style={{ marginTop: 12, color: "#64748b", fontSize: 14, fontWeight: "600" }}>
          Loading doctor schedule…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#065f46" />}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: "#065f46",
            paddingTop: 54,
            paddingBottom: 28,
            paddingHorizontal: 20,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: "#a7f3d0", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 }}>
                DOCTOR DASHBOARD
              </Text>
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 }}>
                Dr. {doctor?.full_name || user?.full_name}
              </Text>
              <Text style={{ color: "#6ee7b7", fontSize: 13, marginTop: 2, fontWeight: "600" }}>
                {doctor?.specialty || "Specialist"} {doctor?.hospital_location ? `· ${doctor.hospital_location}` : ""}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                {doctor?.slot_minutes || 20}m visits
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: 14,
              marginTop: 18,
              paddingVertical: 12,
              paddingHorizontal: 16,
              justifyContent: "space-between",
            }}
          >
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: "#a7f3d0", fontSize: 11, fontWeight: "600" }}>TODAY TOTAL</Text>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 2 }}>
                {todayAppts.length}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: "#fef08a", fontSize: 11, fontWeight: "600" }}>WAITING</Text>
              <Text style={{ color: "#fef08a", fontSize: 18, fontWeight: "800", marginTop: 2 }}>
                {waitingCount}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ color: "#a7f3d0", fontSize: 11, fontWeight: "600" }}>SEEN</Text>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 2 }}>
                {completedCount}
              </Text>
            </View>
            {noShowCount > 0 && (
              <>
                <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
                <View style={{ alignItems: "center", flex: 1 }}>
                  <Text style={{ color: "#fca5a5", fontSize: 11, fontWeight: "600" }}>NO SHOW</Text>
                  <Text style={{ color: "#fca5a5", fontSize: 18, fontWeight: "800", marginTop: 2 }}>
                    {noShowCount}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 14 }}>
          {/* Next Patient Hero Card */}
          <View
            style={{
              backgroundColor: isSoon ? "#fffbeb" : "#ffffff",
              borderRadius: 18,
              padding: 18,
              borderWidth: 1.5,
              borderColor: isSoon ? "#fde68a" : "#e2e8f0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isSoon ? "#d97706" : "#059669",
                  }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: isSoon ? "#b45309" : "#059669",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  NEXT PATIENT QUEUE
                </Text>
              </View>
              {nextDiffMins !== null && (
                <View
                  style={{
                    backgroundColor: isSoon ? "#fef3c7" : "#ecfdf5",
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: isSoon ? "#b45309" : "#047857",
                    }}
                  >
                    {countdown(nextDiffMins)}
                  </Text>
                </View>
              )}
            </View>

            {next ? (
              <View style={{ marginTop: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a" }}>
                      {next.patient?.full_name || "Patient"}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#64748b", fontWeight: "600", marginTop: 2 }}>
                      {fmtTime(next.start_at)} – {fmtTime(next.end_at)} ({fmtDate(next.start_at)})
                    </Text>
                    {next.priority < 2 && (
                      <Text
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          fontWeight: "800",
                          color: next.priority === 0 ? "#dc2626" : "#d97706",
                        }}
                      >
                        {next.priority === 0 ? "EMERGENCY PRIORITY" : "HIGH PRIORITY"}
                      </Text>
                    )}
                  </View>
                  {next.patient?.phone && (
                    <Pressable
                      onPress={() => callPatient(next.patient!.phone)}
                      style={{
                        backgroundColor: "#ecfdf5",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#a7f3d0",
                      }}
                    >
                      <Text style={{ color: "#065f46", fontSize: 13, fontWeight: "700" }}>
                        Call
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Actions for next patient */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    disabled={actingId === next.id}
                    onPress={() => actOnAppointment(next, "complete")}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      backgroundColor: "#059669",
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: actingId === next.id ? 0.65 : 1,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>
                      {actingId === next.id ? "Updating…" : "Mark Seen"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={actingId === next.id}
                    onPress={() => actOnAppointment(next, "no-show")}
                    activeOpacity={0.8}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: "#fecaca",
                      backgroundColor: "#fff1f2",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: actingId === next.id ? 0.65 : 1,
                    }}
                  >
                    <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 14 }}>
                      No-show
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={{ color: "#64748b", marginTop: 10, fontSize: 14 }}>
                No upcoming patients in queue for the next 24 hours.
              </Text>
            )}
          </View>

          {/* Today's Schedule Queue */}
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>
                Today's Patient Queue ({todayAppts.length})
              </Text>
            </View>

            {todayAppts.length === 0 ? (
              <Card>
                <Text style={{ color: "#64748b", fontSize: 14, textAlign: "center", paddingVertical: 12 }}>
                  No appointments scheduled for today.
                </Text>
              </Card>
            ) : (
              <View style={{ gap: 10 }}>
                {todayAppts.map((a) => {
                  const isConfirmed = a.status === "confirmed";
                  return (
                    <Card key={a.id}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
                            {a.patient?.full_name || "Patient"}
                          </Text>
                          <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                            {fmtTime(a.start_at)} – {fmtTime(a.end_at)} · {a.patient?.phone || "No phone"}
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

                      {isConfirmed && (
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" }}>
                          <Pressable
                            disabled={actingId === a.id}
                            onPress={() => actOnAppointment(a, "complete")}
                            style={{
                              flex: 1,
                              backgroundColor: "#059669",
                              paddingVertical: 8,
                              borderRadius: 8,
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                              {actingId === a.id ? "Updating…" : "Seen"}
                            </Text>
                          </Pressable>
                          <Pressable
                            disabled={actingId === a.id}
                            onPress={() => actOnAppointment(a, "no-show")}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 8,
                              backgroundColor: "#fee2e2",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 13 }}>
                              No-show
                            </Text>
                          </Pressable>
                          {a.patient?.phone && (
                            <Pressable
                              onPress={() => callPatient(a.patient!.phone)}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                borderRadius: 8,
                                backgroundColor: "#f1f5f9",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: "#334155", fontWeight: "700", fontSize: 13 }}>
                                Call
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </Card>
                  );
                })}
              </View>
            )}
          </View>

          {/* Doctor Live Alerts & Notifications Feed */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>
                  Clinical Alerts
                </Text>
                {unreadNotifs > 0 && (
                  <View style={{ backgroundColor: "#ef4444", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{unreadNotifs}</Text>
                  </View>
                )}
              </View>
              {unreadNotifs > 0 && (
                <Pressable onPress={markAllNotificationsRead}>
                  <Text style={{ color: "#059669", fontSize: 13, fontWeight: "700" }}>
                    Mark all read
                  </Text>
                </Pressable>
              )}
            </View>

            {notifications.length === 0 ? (
              <Card>
                <Text style={{ color: "#64748b", fontSize: 13, textAlign: "center", paddingVertical: 10 }}>
                  No alerts yet. Upcoming patients will appear here before their consultation.
                </Text>
              </Card>
            ) : (
              <Card>
                <View style={{ gap: 10 }}>
                  {notifications.slice(0, 8).map((n) => {
                    const isUnread = !n.read_at;
                    return (
                      <View
                        key={n.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          gap: 10,
                          paddingVertical: 6,
                          borderBottomWidth: 1,
                          borderBottomColor: "#f1f5f9",
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isUnread ? "#059669" : "#cbd5e1",
                            marginTop: 5,
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: isUnread ? "800" : "600", color: "#0f172a" }}>
                            {n.subject}
                          </Text>
                          <Text style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                            {n.body}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                            {fmtDate(n.created_at)} at {fmtTime(n.created_at)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
