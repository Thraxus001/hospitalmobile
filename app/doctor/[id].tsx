import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, dayChip, eatDateKey, fmtDate, fmtTime, money } from "../../lib/api";
import type { Appointment, Doctor, Slot } from "../../lib/types";
import { Button, Card, Field } from "../../components/ui";

export default function DoctorScreen() {
  const { id, reschedule } = useLocalSearchParams<{ id: string; reschedule?: string }>();
  const router = useRouter();
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

  if (!doctor) return <ActivityIndicator className="mt-10" color="#059669" />;

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
    <View className="flex-1 bg-slate-50">
      <ScrollView contentContainerClassName="p-5 pb-32">
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
            alignSelf: "flex-start",
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor: pressed ? "#e2e8f0" : "transparent",
            cursor: "pointer" as any,
          })}
        >
          <Text style={{ fontSize: 20, color: "#059669", fontWeight: "600" }}>‹</Text>
          <Text style={{ fontSize: 14, color: "#059669", fontWeight: "600" }}>Back</Text>
        </Pressable>
        <Card className="mb-5">
          <Text className="text-xl font-bold text-slate-900">{doctor.full_name}</Text>
          <Text className="text-brand-700">{doctor.specialty} · {doctor.hospital_location}</Text>
          <Text className="mt-2 text-slate-600">{doctor.slot_minutes}-minute consultation · {money(doctor.consultation_fee)}</Text>
        </Card>

        {!reschedule && !referralVerified ? (
          <View style={{ padding: 20 }}>
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
          </View>
        ) : (
          <>
        <Text className="mb-2 font-semibold text-slate-800">Choose a day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-4">
          {days.map((k) => {
            const c = dayChip(k); const on = k === day;
            return (
              <Pressable key={k} onPress={() => setDay(k)} className={`w-16 items-center rounded-xl border py-2 ${on ? "border-brand-600 bg-brand-600" : "border-slate-200 bg-white"}`}>
                <Text className={`text-xs ${on ? "text-brand-100" : "text-slate-500"}`}>{c.dow}</Text>
                <Text className={`text-lg font-bold ${on ? "text-white" : "text-slate-900"}`}>{c.num}</Text>
                <Text className={`text-xs ${on ? "text-brand-100" : "text-slate-500"}`}>{c.mon}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text className="mb-2 font-semibold text-slate-800">Available times</Text>
        {!slots ? <ActivityIndicator color="#059669" /> : slots.length === 0 ? (
          <Text className="text-slate-500">Fully booked for this day. Try another date.</Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {slots.map((s) => {
              const on = picked?.start_at === s.start_at;
              return (
                <Pressable key={s.start_at} onPress={() => setPicked(s)} className={`w-[30%] items-center rounded-xl border py-3 ${on ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"}`}>
                  <Text className={`font-semibold ${on ? "text-brand-700" : "text-slate-800"}`}>{fmtTime(s.start_at)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
          </>
        )}
      </ScrollView>

      {(!reschedule && !referralVerified) ? null : (
      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4 pb-8">
        <Button
          title={picked ? `${reschedule ? "Move to" : "Book"} ${fmtDate(picked.start_at)} · ${fmtTime(picked.start_at)}` : "Select a time"}
          onPress={confirm} disabled={!picked} loading={busy}
        />
        {!reschedule && <Text className="mt-2 text-center text-xs text-slate-500">Your slot is held while you pay. Unpaid bookings are released automatically.</Text>}
      </View>
      )}
    </View>
  );
}
