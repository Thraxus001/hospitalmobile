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
import {
  ALLOWED_BANKS,
  type CardOrBankType,
  DEFAULT_INSURERS,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  loadSavedCardPref,
} from "../../lib/paymentPrefs";
import type { Appointment, HospitalSettings, UserPaymentPref } from "../../lib/types";
import { Button, Card, Field } from "../../components/ui";
import { StyledDropdown } from "../../components/StyledDropdown";

type Method = "mpesa" | "card" | "insurance";

export default function Pay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [method, setMethod] = useState<Method>("mpesa");

  // Form states
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState("");
  const [member, setMember] = useState("");
  const [isInsuranceDropdownOpen, setIsInsuranceDropdownOpen] = useState(false);

  // Card / Bank states
  const [cardOrBankType, setCardOrBankType] = useState<CardOrBankType>("card");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

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

  // Load user saved payment preferences & accepted insurance list
  useEffect(() => {
    (async () => {
      try {
        const [s, p, savedCard] = await Promise.all([
          api<HospitalSettings>("/patient/settings").catch(() => null),
          api<UserPaymentPref>("/patient/preferences"),
          loadSavedCardPref(),
        ]);
        if (s) setSettings(s);

        if (p.preferred_method === "bank") {
          setMethod("card");
          setCardOrBankType("bank");
        } else if (
          p.preferred_method === "mpesa" ||
          p.preferred_method === "card" ||
          p.preferred_method === "insurance"
        ) {
          setMethod(p.preferred_method);
        }

        if (p.mpesa_phone) setPhone(p.mpesa_phone);
        if (p.insurance_provider) setProvider(p.insurance_provider);
        if (p.insurance_member_no) setMember(p.insurance_member_no);

        if (savedCard) {
          if (savedCard.cardHolder) setCardHolder(savedCard.cardHolder);
          if (savedCard.cardNumber) setCardNumber(savedCard.cardNumber);
          if (savedCard.cardExpiry) setCardExpiry(savedCard.cardExpiry);
          if (savedCard.cardCvv) setCardCvv(savedCard.cardCvv);
          if (savedCard.bankName) setBankName(savedCard.bankName);
          if (savedCard.bankAccount) setBankAccount(savedCard.bankAccount);
          if (savedCard.bankHolder) setBankHolder(savedCard.bankHolder);

          if (
            savedCard.cardOrBankType === "bank" ||
            (!savedCard.cardNumber && savedCard.bankAccount)
          ) {
            setCardOrBankType("bank");
          }
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
        if (cardOrBankType === "bank") {
          await api("/payments/bank", {
            body: {
              appointment_id: appt.id,
              bank_name: bankName,
              account_number: bankAccount,
              account_holder: bankHolder || "Valued Patient",
            },
          });
        } else {
          await api("/payments/card", {
            body: {
              appointment_id: appt.id,
              card_number: cardNumber,
              card_holder: cardHolder || "Valued Patient",
              expiry: cardExpiry,
              cvv: cardCvv,
            },
          });
        }
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

  if (!appt) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={{ marginTop: 12, color: "#64748b", fontSize: 14, fontWeight: "600" }}>
          Loading appointment details…
        </Text>
      </View>
    );
  }

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

  const baseInsurers =
    settings?.insurance_providers && settings.insurance_providers.length > 0
      ? settings.insurance_providers
      : DEFAULT_INSURERS;
  const allowedInsurers =
    provider && !baseInsurers.includes(provider)
      ? [provider, ...baseInsurers]
      : baseInsurers;

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
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-slate-900">
              Card & Bank Payment
            </Text>
            <View className="rounded-lg bg-sky-100 px-2 py-0.5">
              <Text className="text-[11px] font-bold text-sky-700">
                {cardOrBankType === "bank" ? "BANK" : detectCardBrand(cardNumber)}
              </Text>
            </View>
          </View>

          {/* Sub-selector: Debit / Credit Card vs Bank Account */}
          <View className="mb-4 flex-row rounded-xl bg-slate-200 p-1">
            {(
              [
                { key: "card", label: "Debit / Credit Card" },
                { key: "bank", label: "Bank Account" },
              ] as const
            ).map((opt) => {
              const active = cardOrBankType === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setCardOrBankType(opt.key)}
                  className={`flex-1 items-center rounded-lg py-2 ${
                    active ? "bg-white shadow-sm" : ""
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      active ? "text-slate-900" : "text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {cardOrBankType === "card" ? (
            <>
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
            </>
          ) : (
            <>
              <StyledDropdown
                label="Select bank"
                placeholder="Select your bank..."
                value={bankName}
                options={ALLOWED_BANKS}
                isOpen={isBankDropdownOpen}
                onToggle={() => setIsBankDropdownOpen((p) => !p)}
                onSelect={(b) => {
                  setBankName(b);
                  setIsBankDropdownOpen(false);
                }}
                headerTitle={`Supported Banks (${ALLOWED_BANKS.length})`}
                clearLabel="Clear Bank"
                onClear={() => {
                  setBankName("");
                  setIsBankDropdownOpen(false);
                }}
              />

              <Field
                label="Account holder name"
                placeholder="e.g. Jane Doe"
                value={bankHolder}
                onChangeText={setBankHolder}
              />

              <Field
                label="Bank account number"
                keyboardType="number-pad"
                placeholder="e.g. 0123456789"
                value={bankAccount}
                onChangeText={(v) => setBankAccount(v.replace(/\D/g, ""))}
              />

              <View className="mt-2">
                <Button
                  title={`Pay ${money(appt.amount_due)} with Bank Account`}
                  onPress={submit}
                  loading={busy}
                  disabled={!bankName || bankAccount.replace(/\D/g, "").length < 4}
                />
              </View>
            </>
          )}
        </Card>
      ) : (
        <Card className="p-4 mb-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-slate-900">
              Insurance Cover
            </Text>
            <View
              style={{
                backgroundColor: "#dcfce7",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: "#15803d",
                  fontWeight: "700",
                }}
              >
                INSURANCE
              </Text>
            </View>
          </View>

          <StyledDropdown
            label="Insurance provider"
            placeholder="Select your insurance provider..."
            value={provider}
            options={allowedInsurers}
            isOpen={isInsuranceDropdownOpen}
            onToggle={() => setIsInsuranceDropdownOpen((p) => !p)}
            onSelect={(item) => {
              setProvider(item);
              setIsInsuranceDropdownOpen(false);
            }}
            headerTitle={`Accepted Insurance Partners (${allowedInsurers.length})`}
            clearLabel="Clear Provider"
            onClear={() => {
              setProvider("");
              setIsInsuranceDropdownOpen(false);
            }}
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
        </Card>
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
