import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, fmtDate, fmtTime, money } from "../../lib/api";
import { storage } from "../../lib/storage";
import type { Appointment, UserPaymentPref } from "../../lib/types";
import { Button, Card, Field } from "../../components/ui";

type Method = "mpesa" | "card" | "insurance";

function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

export default function Pay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [method, setMethod] = useState<Method>("mpesa");

  // Form states
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState("");
  const [member, setMember] = useState("");

  // Card / Bank states
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [busy, setBusy] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Live timer state
  const [remainingSecs, setRemainingSecs] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const a = await api<Appointment>(`/appointments/${id}`);
    setAppt(a);
    return a;
  }, [id]);

  useEffect(() => {
    refresh().catch((e) => Alert.alert("Error", e.message));
    return () => clearInterval(poll.current);
  }, [refresh]);

  // Countdown timer for 2-minute hold
  useEffect(() => {
    if (!appt?.hold_expires_at || appt.status !== "pending_payment") {
      setRemainingSecs(null);
      return;
    }

    const calc = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(appt.hold_expires_at!).getTime() - Date.now()) / 1000)
      );
      setRemainingSecs(diff);
      if (diff <= 0) {
        refresh();
      }
    };

    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [appt?.hold_expires_at, appt?.status, refresh]);

  // Load user saved payment preferences to prefill
  useEffect(() => {
    (async () => {
      try {
        const p = await api<UserPaymentPref>("/patient/preferences");
        if (
          p.preferred_method === "mpesa" ||
          p.preferred_method === "card" ||
          p.preferred_method === "insurance"
        ) {
          setMethod(p.preferred_method);
        }
        if (p.mpesa_phone) setPhone(p.mpesa_phone);
        if (p.insurance_provider) setProvider(p.insurance_provider);
        if (p.insurance_member_no) setMember(p.insurance_member_no);

        const savedCardStr = await storage.getItem("saved_card_pref");
        if (savedCardStr) {
          const parsed = JSON.parse(savedCardStr);
          if (parsed.cardHolder) setCardHolder(parsed.cardHolder);
          if (parsed.cardNumber) setCardNumber(parsed.cardNumber);
          if (parsed.cardExpiry) setCardExpiry(parsed.cardExpiry);
          if (parsed.cardCvv) setCardCvv(parsed.cardCvv);
        }
      } catch {}
    })();
  }, []);

  // after an M-Pesa prompt, poll until callback confirms booking
  const startPolling = () => {
    setWaiting(true);
    clearInterval(poll.current);
    poll.current = setInterval(async () => {
      try {
        const a = await refresh();
        if (a.status !== "pending_payment") {
          clearInterval(poll.current);
          setWaiting(false);
        }
      } catch {}
    }, 3000);
  };

  const submit = async () => {
    if (!appt) return;
    setBusy(true);
    try {
      if (method === "mpesa") {
        await api("/payments/mpesa", {
          body: { appointment_id: appt.id, phone },
        });
        startPolling();
      } else if (method === "card") {
        await api("/payments/card", {
          body: {
            appointment_id: appt.id,
            card_number: cardNumber,
            card_holder: cardHolder || "Valued Patient",
            expiry: cardExpiry,
            cvv: cardCvv,
          },
        });
        await refresh();
      } else {
        await api("/payments/insurance", {
          body: {
            appointment_id: appt.id,
            provider,
            member_no: member,
          },
        });
        const a = await refresh();
        if (a.status === "pending_payment") {
          Alert.alert(
            "Insurance verified",
            `Please pay the remaining co-pay of ${money(a.amount_due)}.`
          );
        }
      }
    } catch (e: any) {
      Alert.alert("Payment failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  const releaseSlot = async () => {
    if (!appt) return;
    const execute = async () => {
      setReleasing(true);
      try {
        await api(`/appointments/${appt.id}/cancel`, {
          method: "POST",
          body: {},
        });
        await refresh();
      } catch (e: any) {
        console.warn("Release note:", e.message);
        await refresh();
      } finally {
        setReleasing(false);
      }
    };

    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined" && window.confirm
          ? window.confirm("Release this spot? Other patients will be able to book this time.")
          : true;
      if (ok) execute();
    } else {
      Alert.alert(
        "Release slot?",
        "Your held spot will be released immediately so other patients can book it.",
        [
          { text: "Keep spot", style: "cancel" },
          { text: "Release slot", style: "destructive", onPress: execute },
        ]
      );
    }
  };

  if (!appt) return <ActivityIndicator className="mt-10" color="#059669" />;

  if (appt.status === "confirmed")
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-8">
        <Text className="mt-4 text-2xl font-bold text-slate-900">
          You're booked
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          {appt.doctor.full_name}
          {"\n"}
          {fmtDate(appt.start_at)} at {fmtTime(appt.start_at)}
        </Text>
        <View className="mt-8 w-full">
          <Button
            title="View my appointments"
            onPress={() => router.replace("/(tabs)/appointments")}
          />
        </View>
      </View>
    );

  if (appt.status === "cancelled")
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-8">
        <Text className="text-2xl font-bold text-slate-900">Spot released</Text>
        <Text className="mt-2 text-center text-slate-600">
          The 2-minute hold window expired or the slot was released. You can
          book another slot at any time.
        </Text>
        <View className="mt-8 w-full">
          <Button
            title="Book Another Slot"
            onPress={() => router.replace("/(tabs)")}
          />
        </View>
      </View>
    );

  const mins = remainingSecs !== null ? Math.floor(remainingSecs / 60) : 0;
  const secs = remainingSecs !== null ? remainingSecs % 60 : 0;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-5">
      <Card className="mb-4">
        <Text className="text-lg font-semibold text-slate-900">
          {appt.doctor.full_name}
        </Text>
        <Text className="text-slate-500">
          {fmtDate(appt.start_at)} · {fmtTime(appt.start_at)}
        </Text>
        <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
          <Text className="text-slate-600">Amount due</Text>
          <Text className="text-xl font-bold text-slate-900">
            {money(appt.amount_due)}
          </Text>
        </View>
      </Card>

      {/* 2-minute countdown banner */}
      {remainingSecs !== null && (
        <View
          style={{
            backgroundColor: remainingSecs < 60 ? "#fff1f2" : "#fef3c7",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: remainingSecs < 60 ? "#fecaca" : "#fde68a",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: remainingSecs < 60 ? "#dc2626" : "#b45309",
              }}
            >
              Spot held for 2 minutes
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: remainingSecs < 60 ? "#ef4444" : "#92400e",
              }}
            >
              Complete payment before spot is dropped
            </Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: remainingSecs < 60 ? "#dc2626" : "#b45309",
            }}
          >
            {mins}:{secs < 10 ? `0${secs}` : secs}
          </Text>
        </View>
      )}

      {/* Payment Method Selector */}
      <View className="mb-4 flex-row rounded-xl bg-slate-200 p-1">
        {(["mpesa", "card", "insurance"] as Method[]).map((m) => {
          const labels = {
            mpesa: "M-Pesa",
            card: "Card / Bank",
            insurance: "Insurance",
          };
          return (
            <Pressable
              key={m}
              onPress={() => setMethod(m)}
              className={`flex-1 items-center rounded-lg py-2.5 ${
                method === m ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  method === m ? "text-brand-700" : "text-slate-600"
                }`}
              >
                {labels[m]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {waiting ? (
        <Card className="items-center py-8">
          <ActivityIndicator color="#059669" />
          <Text className="mt-4 text-center font-medium text-slate-800">
            Check your phone and enter your M-Pesa PIN
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            This screen updates automatically once payment is received.
          </Text>
          <View className="mt-5 w-full">
            <Button
              variant="outline"
              title="Try a different number"
              onPress={() => {
                clearInterval(poll.current);
                setWaiting(false);
              }}
            />
          </View>
        </Card>
      ) : method === "mpesa" ? (
        <>
          <Field
            label="M-Pesa phone number"
            keyboardType="phone-pad"
            placeholder="07XX XXX XXX"
            value={phone}
            onChangeText={setPhone}
          />
          <Button
            title={`Pay ${money(appt.amount_due)}`}
            onPress={submit}
            loading={busy}
            disabled={phone.length < 9}
          />
        </>
      ) : method === "card" ? (
        <Card className="p-4 mb-3">
          <Text className="text-sm font-bold text-slate-900 mb-3">
            Credit / Debit Card
          </Text>

          <Field
            label="Cardholder name"
            placeholder="e.g. Jane Doe"
            value={cardHolder}
            onChangeText={setCardHolder}
          />

          <Field
            label="Card number"
            keyboardType="number-pad"
            placeholder="4000 1234 5678 9010"
            value={cardNumber}
            onChangeText={(v) => setCardNumber(formatCardNumber(v))}
            maxLength={19}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Expiry date"
                keyboardType="number-pad"
                placeholder="MM/YY"
                value={cardExpiry}
                onChangeText={(v) => setCardExpiry(formatExpiry(v))}
                maxLength={5}
              />
            </View>
            <View className="flex-1">
              <Field
                label="CVV"
                keyboardType="number-pad"
                placeholder="123"
                value={cardCvv}
                onChangeText={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <View className="mt-2">
            <Button
              title={`Pay ${money(appt.amount_due)} with Card`}
              onPress={submit}
              loading={busy}
              disabled={cardNumber.replace(/\s/g, "").length < 12}
            />
          </View>
        </Card>
      ) : (
        <>
          <Field
            label="Insurance provider"
            placeholder="e.g. AAR Insurance"
            value={provider}
            onChangeText={setProvider}
          />
          <Field
            label="Member number"
            autoCapitalize="characters"
            placeholder="Your policy / member number"
            value={member}
            onChangeText={setMember}
          />
          <Button
            title="Verify cover"
            onPress={submit}
            loading={busy}
            disabled={!provider || !member}
          />
        </>
      )}

      {/* Release Slot Button */}
      <View style={{ marginTop: 16 }}>
        <Button
          variant="danger"
          title={releasing ? "Releasing spot..." : "Release held slot"}
          loading={releasing}
          onPress={releaseSlot}
        />
      </View>

      <Text className="mt-4 text-center text-xs text-slate-500">
        Your spot is held for 2 minutes from the time of booking. If payment is
        not completed, the slot will be automatically dropped.
      </Text>
    </ScrollView>
  );
}
