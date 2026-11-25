import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, dayChip, eatDateKey, fmtDate, fmtTime, money } from "../../lib/api";
import type { Appointment, Doctor, Slot } from "../../lib/types";
import { Button, Card, Field } from "../../components/ui";

export default function DoctorScreen() {
  const { id, reschedule } = useLocalSearchParams<{ id: string; reschedule?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const slotWidth = Math.max(88, Math.floor((screenWidth - 40 - 16) / 3));
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [picked, setPicked] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralVerified, setReferralVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [referralErr, setReferralErr] = useState("");

  // next 14 days, keeping only the days this doctor actually works
  const days = useMemo(() => {
    if (!doctor) return [];
    return Array.from({ length: 14 }, (_, i) => eatDateKey(i)).filter((k) => doctor.working_days.includes(dayChip(k).monWd));
  }, [doctor]);

  useEffect(() => { api<Doctor>(`/doctors/${id}`).then(setDoctor).catch((e) => Alert.alert("Error", e.message)); }, [id]);
  useEffect(() => { if (days.length && !day) setDay(days[0]); }, [days, day]);

  const loadSlots = useCallback(async () => {
    if (!day) return;
    setSlots(null); setPicked(null);
    try { setSlots(await api<Slot[]>(`/doctors/${id}/slots?day=${day}`)); }
    catch (e: any) { Alert.alert("Error", e.message); setSlots([]); }
  }, [day, id]);
  useEffect(() => { loadSlots(); }, [loadSlots]);

  const verifyCode = async () => {
    const trimmed = referralCode.trim().toUpperCase();
    if (!trimmed || trimmed.length > 8) {
      setReferralErr("Please enter a valid referral code (up to 8 characters).");
      return;
    }
    setVerifyingCode(true);
    setReferralErr("");
    try {
      await api("/referrals/verify", {
        body: { code: trimmed, doctor_id: Number(id) },
      });
      setReferralVerified(true);
      setReferralErr("");
    } catch (e: any) {
      setReferralErr(e.message || "Invalid or unrecognised referral code.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const confirm = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      if (reschedule) {
        await api<Appointment>(`/appointments/${reschedule}/reschedule`, { body: { start_at: picked.start_at } });
        Alert.alert("Rescheduled", `New time: ${fmtDate(picked.start_at)} at ${fmtTime(picked.start_at)}`);
        router.replace("/(tabs)/appointments");
      } else {
        const appt = await api<Appointment>("/appointments", { body: { doctor_id: Number(id), start_at: picked.start_at, referral_code: referralCode.trim().toUpperCase() } });
        router.replace(`/pay/${appt.id}`);
      }
    } catch (e: any) {
      Alert.alert("Could not book", e.message);
      loadSlots(); // someone else may have taken it
    } finally { setBusy(false); }
  };

  if (!doctor) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={{ marginTop: 12, color: "#64748b", fontSize: 14, fontWeight: "600" }}>
          Loading specialist details…
        </Text>
      </View>
    );
  }

  const handleBack = () => {
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

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.75}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
            alignSelf: "flex-start",
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 20, color: "#059669", fontWeight: "600" }}>‹</Text>
          <Text style={{ fontSize: 14, color: "#059669", fontWeight: "600" }}>Back</Text>
        </TouchableOpacity>
        <Card style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 19, fontWeight: "700", color: "#0f172a" }}>{doctor.full_name}</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#047857", marginTop: 2 }}>
            {doctor.specialty} · {doctor.hospital_location}
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
            {doctor.slot_minutes}-minute consultation · {money(doctor.consultation_fee)}
          </Text>
        </Card>

        {!reschedule && !referralVerified ? (
          <Card style={{ padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 6 }}>
              Referral code required
            </Text>
            <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
              Enter the referral code provided by your general doctor to book with this specialist.
            </Text>
            <Field
              label="Referral code"
              placeholder="Enter your referral code"
              value={referralCode}
              onChangeText={(v) => {
                setReferralCode(v.replace(/[^A-Za-z0-9]/g, "").slice(0, 8));
                setReferralErr("");
              }}
              autoCapitalize="characters"
              maxLength={8}
            />
            {referralErr !== "" && (
              <Text style={{ color: "#dc2626", fontSize: 13, marginBottom: 8 }}>{referralErr}</Text>
            )}
            <Button
              title={verifyingCode ? "Verifying..." : "Verify referral code"}
              onPress={verifyCode}
              loading={verifyingCode}
              disabled={referralCode.trim().length === 0 || verifyingCode}
            />
          </Card>
        ) : (
          <>
            <Text style={{ marginBottom: 10, fontSize: 15, fontWeight: "700", color: "#1e293b" }}>
              Choose a day
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
            >
              {days.map((k) => {
                const c = dayChip(k);
                const on = k === day;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setDay(k)}
                    style={{
                      width: 64,
                      alignItems: "center",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: on ? "#059669" : "#e2e8f0",
                      backgroundColor: on ? "#059669" : "#ffffff",
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: on ? "#d1fae5" : "#64748b", fontWeight: "600" }}>
                      {c.dow}
                    </Text>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: on ? "#ffffff" : "#0f172a", marginVertical: 1 }}>
                      {c.num}
                    </Text>
                    <Text style={{ fontSize: 11, color: on ? "#d1fae5" : "#64748b", fontWeight: "600" }}>
                      {c.mon}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={{ marginBottom: 10, fontSize: 15, fontWeight: "700", color: "#1e293b" }}>
              Available times
            </Text>
            {!slots ? (
              <ActivityIndicator color="#059669" />
            ) : slots.length === 0 ? (
              <Text style={{ color: "#64748b", fontSize: 14 }}>
                Fully booked for this day. Try another date.
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {slots.map((s) => {
                  const on = picked?.start_at === s.start_at;
                  return (
                    <Pressable
                      key={s.start_at}
                      onPress={() => setPicked(s)}
                      style={{
                        width: slotWidth,
                        alignItems: "center",
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: on ? "#059669" : "#e2e8f0",
                        backgroundColor: on ? "#ecfdf5" : "#ffffff",
                        paddingVertical: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: 14,
                          color: on ? "#047857" : "#1e293b",
                        }}
                      >
                        {fmtTime(s.start_at)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!reschedule && !referralVerified ? null : (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#e2e8f0",
            backgroundColor: "#ffffff",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          }}
        >
          <Button
            title={
              picked
                ? `${reschedule ? "Move to" : "Book"} ${fmtDate(picked.start_at)} · ${fmtTime(picked.start_at)}`
                : "Select a time"
            }
            onPress={confirm}
            disabled={!picked}
            loading={busy}
          />
          {!reschedule && (
            <Text
              style={{
                marginTop: 8,
                textAlign: "center",
                fontSize: 12,
                color: "#64748b",
              }}
            >
              Your slot is held while you pay. Unpaid bookings are released automatically.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
