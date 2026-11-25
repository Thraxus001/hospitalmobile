import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api, fmtDate, fmtTime, money } from "../../lib/api";
import type { Appointment } from "../../lib/types";
import { Button, Card, StatusBadge } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import DoctorSchedule from "../../components/DoctorSchedule";

function HoldTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string | null;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (!expiresAt) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining < 60;

  if (remaining <= 0) {
    return (
      <View
        style={{
          marginTop: 8,
          backgroundColor: "#fee2e2",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#dc2626" }}>
          2-minute hold expired · Spot has been released
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        marginTop: 8,
        backgroundColor: isUrgent ? "#fff1f2" : "#fef3c7",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: isUrgent ? "#fecaca" : "#fde68a",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: isUrgent ? "#dc2626" : "#b45309",
          }}
        >
          Spot held for 2 min:
        </Text>
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "800",
          color: isUrgent ? "#dc2626" : "#b45309",
          letterSpacing: 0.5,
        }}
      >
        {mins}:{secs < 10 ? `0${secs}` : secs} left
      </Text>
    </View>
  );
}

export default function Appointments() {
  const router = useRouter();
  const { user } = useAuth();

  if (user?.role === "doctor") {
    return <DoctorSchedule />;
  }

  const [items, setItems] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api<Appointment[]>("/appointments");
      setItems(data);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Cross-platform cancel/release executor
  const executeCancel = async (id: number) => {
    setCancellingId(id);

    // Optimistic UI update: immediately mark appointment as cancelled
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "cancelled" } : item
      )
    );

    try {
      await api(`/appointments/${id}/cancel`, {
        method: "POST",
        body: {},
      });
    } catch (e: any) {
      console.warn("Release slot note:", e.message);
    } finally {
      setCancellingId(null);
      load();
    }
  };

  // Trigger release slot confirmation (handles both Web and Native properly)
  const confirmReleaseSlot = (a: Appointment) => {
    const isPending = a.status === "pending_payment";
    const msg = isPending
      ? "Release this held spot? It will immediately become free for other patients."
      : "Cancelling less than 24 hours before the visit does not qualify for a refund.";

    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined" && window.confirm
          ? window.confirm(
              isPending ? `Release Slot?\n\n${msg}` : `Cancel Appointment?\n\n${msg}`
            )
          : true;
      if (ok) {
        executeCancel(a.id);
      }
    } else {
      Alert.alert(
        isPending ? "Release slot?" : "Cancel appointment?",
        msg,
        [
          { text: "Keep", style: "cancel" },
          {
            text: isPending ? "Release slot" : "Cancel appointment",
            style: "destructive",
            onPress: () => executeCancel(a.id),
          },
        ]
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#0f4c81",
          paddingTop: 56,
          paddingBottom: 28,
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ color: "#93c5fd", fontSize: 13, fontWeight: "600" }}>
          OVERVIEW
        </Text>
        <Text
          style={{
            color: "#fff",
            fontSize: 26,
            fontWeight: "800",
            marginTop: 4,
            letterSpacing: -0.5,
          }}
        >
          My Appointments
        </Text>
        <Text style={{ color: "#bfdbfe", fontSize: 14, marginTop: 4 }}>
          {items.length > 0
            ? `${items.length} appointment${items.length === 1 ? "" : "s"} on file`
            : "No appointments yet"}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(a) => String(a.id)}
        refreshing={refreshing}
        onRefresh={load}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}
        ListEmptyComponent={
          <View
            style={{
              marginTop: 60,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: "#334155",
                marginBottom: 6,
              }}
            >
              No appointments yet
            </Text>
            <Text style={{ color: "#94a3b8", fontSize: 14, textAlign: "center" }}>
              Book with a specialist to get started.
            </Text>
          </View>
        }
        renderItem={({ item: a }) => {
          const isCancellingThis = cancellingId === a.id;

          return (
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "800",
                      color: "#0f172a",
                      marginBottom: 2,
                    }}
                  >
                    {a.doctor.full_name}
                  </Text>
                  <Text style={{ color: "#64748b", fontSize: 13 }}>
                    {a.doctor.specialty}
                  </Text>
                </View>
                <StatusBadge status={a.status} />
              </View>

              <View
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f8fafc",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#334155",
                  }}
                >
                  {fmtDate(a.start_at)} · {fmtTime(a.start_at)}–{fmtTime(a.end_at)}
                </Text>
              </View>

              {/* Live 2-minute countdown timer for pending held slots */}
              {a.status === "pending_payment" && (
                <HoldTimer
                  expiresAt={a.hold_expires_at}
                  onExpire={() => {
                    load();
                  }}
                />
              )}

              {a.priority < 2 && (
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: "800",
                    color: "#dc2626",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {a.priority === 0 ? "EMERGENCY" : "HIGH PRIORITY"}
                </Text>
              )}

              <View style={{ marginTop: 12, gap: 8 }}>
                {a.status === "pending_payment" && (
                  <>
                    <Button
                      title={`Pay ${money(a.amount_due)} to confirm`}
                      onPress={() => router.push(`/pay/${a.id}`)}
                    />
                    <Button
                      variant="danger"
                      title={isCancellingThis ? "Releasing slot..." : "Release slot"}
                      loading={isCancellingThis}
                      onPress={() => confirmReleaseSlot(a)}
                    />
                  </>
                )}

                {a.status === "no_show" && (
                  <>
                    <Text style={{ fontSize: 13, color: "#64748b" }}>
                      You missed this visit. Your fee is kept, and you can rebook
                      at no extra cost.
                    </Text>
                    <Button
                      title="Reschedule"
                      onPress={() =>
                        router.push(
                          `/doctor/${a.doctor_id}?reschedule=${a.id}`
                        )
                      }
                    />
                  </>
                )}

                {a.status === "confirmed" && (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        variant="outline"
                        title="Reschedule"
                        onPress={() =>
                          router.push(
                            `/doctor/${a.doctor_id}?reschedule=${a.id}`
                          )
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        variant="danger"
                        title={isCancellingThis ? "Cancelling..." : "Cancel"}
                        loading={isCancellingThis}
                        onPress={() => confirmReleaseSlot(a)}
                      />
                    </View>
                  </View>
                )}
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}
