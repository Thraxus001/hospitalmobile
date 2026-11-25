import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import {
  ALLOWED_BANKS,
  buildSavedPrefItems,
  type CardOrBankType,
  DEFAULT_INSURERS,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  loadSavedCardPref,
  METHOD_LABELS,
  saveCardPref,
  type SavedCardPref,
  type SavedPrefItem,
} from "../../lib/paymentPrefs";
import type { HospitalSettings, UserPaymentPref } from "../../lib/types";
import { Button, Card, Field } from "../../components/ui";
import { StyledDropdown } from "../../components/StyledDropdown";
import DoctorProfile from "../../components/DoctorProfile";

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#059669",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#fff",
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}>
        {initials}
      </Text>
    </View>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();

  if (user?.role === "doctor") {
    return <DoctorProfile />;
  }

  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const [insurer, setInsurer] = useState("");
  const [memberNo, setMemberNo] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Insurance dropdown
  const [isInsuranceDropdownOpen, setIsInsuranceDropdownOpen] = useState(false);

  // Card / Bank state
  const [cardOrBankType, setCardOrBankType] = useState<CardOrBankType>("card");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [savedItems, setSavedItems] = useState<SavedPrefItem[]>([]);

  const notifyUser = (title: string, message: string) => {
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined" && window.alert) {
          window.alert(`${title}: ${message}`);
        }
      } catch {}
    } else {
      Alert.alert(title, message);
    }
  };

  const load = useCallback(async () => {
    try {
      const [s, p, savedCard] = await Promise.all([
        api<HospitalSettings>("/patient/settings"),
        api<UserPaymentPref>("/patient/preferences"),
        loadSavedCardPref(),
      ]);
      setSettings(s);
      setMethod(p.preferred_method);
      setInsurer(p.insurance_provider ?? "");
      setMemberNo(p.insurance_member_no ?? "");
      setMpesaPhone(p.mpesa_phone ?? "");

      if (savedCard) {
        setCardOrBankType(savedCard.cardOrBankType);
        if (savedCard.cardHolder) setCardHolder(savedCard.cardHolder);
        if (savedCard.cardNumber) setCardNumber(savedCard.cardNumber);
        if (savedCard.cardExpiry) setCardExpiry(savedCard.cardExpiry);
        if (savedCard.cardCvv) setCardCvv(savedCard.cardCvv);
        if (savedCard.bankName) setBankName(savedCard.bankName);
        if (savedCard.bankAccount) setBankAccount(savedCard.bankAccount);
        if (savedCard.bankHolder) setBankHolder(savedCard.bankHolder);
      } else if (user?.full_name) {
        setCardHolder(user.full_name);
        setBankHolder(user.full_name);
      }

      setSavedItems(buildSavedPrefItems(p, savedCard));
      setLoaded(true);
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      // 1. Save general payment preferences to backend
      const updatedPref = await api<UserPaymentPref>("/patient/preferences", {
        method: "PUT",
        body: {
          preferred_method: method,
          insurance_provider: insurer || null,
          insurance_member_no: memberNo || null,
          mpesa_phone: mpesaPhone || null,
        },
      });

      // 2. Save Card & Bank preferences securely
      const cardPayload: SavedCardPref = {
        cardOrBankType,
        cardHolder,
        cardNumber,
        cardExpiry,
        cardCvv,
        bankName,
        bankAccount,
        bankHolder,
      };
      await saveCardPref(cardPayload);

      const items = buildSavedPrefItems(updatedPref, cardPayload);
      setSavedItems(items);
      setFeedback({ type: "success", msg: "Payment preferences saved successfully!" });

      const summary = items.length
        ? items.map((i) => `• ${i.label}: ${i.value}${i.isDefault ? " (Default)" : ""}`).join("\n")
        : "Your payment preferences have been updated.";
      notifyUser("Preferences Saved", summary);
    } catch (e: any) {
      setFeedback({ type: "error", msg: e.message || "Failed to save payment preferences." });
      notifyUser("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const allowedInsurers =
    settings?.insurance_providers && settings.insurance_providers.length > 0
      ? settings.insurance_providers
      : DEFAULT_INSURERS;

  const cardBrand = detectCardBrand(cardNumber);

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Profile hero ── */}
        <View
          style={{
            backgroundColor: "#065f46",
            paddingTop: 56,
            paddingBottom: 56,
            alignItems: "center",
          }}
        >
          <Avatar name={user?.full_name ?? "U"} />
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "800",
              marginTop: 12,
              letterSpacing: -0.3,
            }}
          >
            {user?.full_name}
          </Text>
          <Text style={{ color: "#6ee7b7", fontSize: 14, marginTop: 4 }}>
            {user?.phone}
          </Text>
          {user?.email && (
            <Text style={{ color: "#a7f3d0", fontSize: 13, marginTop: 2 }}>
              {user.email}
            </Text>
          )}
          <View
            style={{
              marginTop: 14,
              paddingHorizontal: 16,
              paddingVertical: 6,
              backgroundColor: "#ecfdf5",
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                color: "#059669",
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Patient
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
          {/* ── Payment preferences ── */}
          <Card className="mb-5 p-4">
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: 4,
              }}
            >
              Payment preferences
            </Text>
            <Text
              style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}
            >
              Set your preferred payment method for faster booking checkout.
            </Text>

            {!loaded ? (
              <ActivityIndicator color="#059669" />
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#374151",
                    marginBottom: 10,
                  }}
                >
                  Preferred method
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {(
                    settings?.payment_methods ?? ["mpesa", "card", "insurance"]
                  ).map((m) => {
                    const on = method === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setMethod(m)}
                        style={{
                          paddingHorizontal: 18,
                          paddingVertical: 10,
                          borderRadius: 24,
                          borderWidth: 2,
                          borderColor: on ? "#059669" : "#e2e8f0",
                          backgroundColor: on ? "#ecfdf5" : "#f8fafc",
                        }}
                      >
                        <Text
                          style={{
                            color: on ? "#059669" : "#64748b",
                            fontWeight: on ? "800" : "500",
                            fontSize: 14,
                          }}
                        >
                          {METHOD_LABELS[m] ?? m}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {method && (
                    <Pressable
                      onPress={() => setMethod(null)}
                      style={{
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        borderRadius: 24,
                        borderWidth: 2,
                        borderColor: "#e2e8f0",
                      }}
                    >
                      <Text style={{ color: "#94a3b8", fontWeight: "500" }}>
                        Clear
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* ── M-Pesa section ── */}
                {method === "mpesa" && (
                  <View style={{ marginBottom: 12 }}>
                    <Field
                      label="M-Pesa phone number"
                      keyboardType="phone-pad"
                      placeholder="07XX XXX XXX"
                      value={mpesaPhone}
                      onChangeText={setMpesaPhone}
                    />
                  </View>
                )}

                {/* ── CARD & BANK SECTION ── */}
                {(method === "card" || method === null) && (
                  <View
                    style={{
                      marginBottom: 16,
                      backgroundColor: "#f8fafc",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1.5,
                      borderColor: method === "card" ? "#a7f3d0" : "#e2e8f0",
                    }}
                  >
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
                          fontSize: 14,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        Card & Bank Details
                      </Text>
                      <View
                        style={{
                          backgroundColor: "#e0f2fe",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#0369a1",
                            fontWeight: "700",
                          }}
                        >
                          {cardOrBankType === "bank" ? "BANK" : cardBrand}
                        </Text>
                      </View>
                    </View>

                    {/* Sub-selector: Card vs Bank Account */}
                    <View
                      style={{
                        flexDirection: "row",
                        backgroundColor: "#e2e8f0",
                        borderRadius: 12,
                        padding: 3,
                        marginBottom: 16,
                      }}
                    >
                      <Pressable
                        onPress={() => setCardOrBankType("card")}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor:
                            cardOrBankType === "card" ? "#fff" : "transparent",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight:
                              cardOrBankType === "card" ? "700" : "500",
                            color:
                              cardOrBankType === "card" ? "#0f172a" : "#64748b",
                          }}
                        >
                          Debit / Credit Card
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setCardOrBankType("bank")}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor:
                            cardOrBankType === "bank" ? "#fff" : "transparent",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight:
                              cardOrBankType === "bank" ? "700" : "500",
                            color:
                              cardOrBankType === "bank" ? "#0f172a" : "#64748b",
                          }}
                        >
                          Bank Account
                        </Text>
                      </Pressable>
                    </View>

                    {/* 1. DEBIT / CREDIT CARD FORM */}
                    {cardOrBankType === "card" ? (
                      <View>
                        {/* Interactive Card Mockup Preview */}
                        <View
                          style={{
                            backgroundColor: "#0f172a",
                            borderRadius: 16,
                            padding: 18,
                            marginBottom: 16,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.2,
                            shadowRadius: 10,
                            elevation: 6,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              marginBottom: 20,
                            }}
                          >
                            <View
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                backgroundColor: "rgba(255,255,255,0.15)",
                                borderRadius: 8,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#fff",
                                  fontWeight: "800",
                                  fontSize: 12,
                                  letterSpacing: 1,
                                }}
                              >
                                {cardBrand}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 17,
                              fontWeight: "700",
                              letterSpacing: 2,
                              marginBottom: 16,
                            }}
                          >
                            {cardNumber
                              ? cardNumber
                              : "•••• •••• •••• ••••"}
                          </Text>

                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "flex-end",
                            }}
                          >
                            <View>
                              <Text
                                style={{
                                  color: "#94a3b8",
                                  fontSize: 9,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Cardholder Name
                              </Text>
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 13,
                                  fontWeight: "700",
                                  marginTop: 2,
                                }}
                                numberOfLines={1}
                              >
                                {cardHolder
                                  ? cardHolder.toUpperCase()
                                  : user?.full_name?.toUpperCase() || "YOUR NAME"}
                              </Text>
                            </View>

                            <View style={{ alignItems: "flex-end" }}>
                              <Text
                                style={{
                                  color: "#94a3b8",
                                  fontSize: 9,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Expires
                              </Text>
                              <Text
                                style={{
                                  color: "#fff",
                                  fontSize: 13,
                                  fontWeight: "700",
                                  marginTop: 2,
                                }}
                              >
                                {cardExpiry ? cardExpiry : "MM/YY"}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Card input fields */}
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
                          onChangeText={(v) =>
                            setCardNumber(formatCardNumber(v))
                          }
                          maxLength={19}
                        />

                        <View style={{ flexDirection: "row", gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <Field
                              label="Expiry date"
                              keyboardType="number-pad"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChangeText={(v) =>
                                setCardExpiry(formatExpiry(v))
                              }
                              maxLength={5}
                            />
                          </View>

                          <View style={{ flex: 1 }}>
                            <Field
                              label="CVV / CVC"
                              keyboardType="number-pad"
                              placeholder="123"
                              value={cardCvv}
                              onChangeText={(v) =>
                                setCardCvv(v.replace(/\D/g, "").slice(0, 4))
                              }
                              maxLength={4}
                              secureTextEntry
                            />
                          </View>
                        </View>

                        <Text
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            lineHeight: 18,
                            marginTop: 2,
                          }}
                        >
                          256-bit SSL encrypted. Card details are saved for
                          seamless 1-click consultation payments.
                        </Text>
                      </View>
                    ) : (
                      /* 2. BANK ACCOUNT FORM */
                      <View>
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
                          onChangeText={setBankAccount}
                        />

                        <Text
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            lineHeight: 18,
                            marginTop: 2,
                          }}
                        >
                          Direct bank transfer and EFT bill payments will be
                          pre-associated with your verified bank account.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ── INSURANCE SECTION ── */}
                {(method === "insurance" || method === null) && (
                  <View
                    style={{
                      marginBottom: 16,
                      backgroundColor: "#f8fafc",
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1.5,
                      borderColor: method === "insurance" ? "#a7f3d0" : "#e2e8f0",
                    }}
                  >
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
                          fontSize: 14,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        Insurance Details
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
                          COVER
                        </Text>
                      </View>
                    </View>

                    <StyledDropdown
                      label="Insurance provider"
                      placeholder="Select your insurance provider..."
                      value={insurer}
                      options={allowedInsurers}
                      isOpen={isInsuranceDropdownOpen}
                      onToggle={() => setIsInsuranceDropdownOpen((prev) => !prev)}
                      onSelect={(item) => {
                        setInsurer(item);
                        setIsInsuranceDropdownOpen(false);
                      }}
                      headerTitle={`Accepted Insurance Partners (${allowedInsurers.length})`}
                      clearLabel="Clear Provider"
                      onClear={() => {
                        setInsurer("");
                        setIsInsuranceDropdownOpen(false);
                      }}
                    />

                    <View style={{ marginTop: 4 }}>
                      <Field
                        label="Member number"
                        autoCapitalize="characters"
                        value={memberNo}
                        onChangeText={setMemberNo}
                        placeholder="Your membership / policy number"
                      />
                    </View>
                  </View>
                )}

                {feedback && (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      marginTop: 10,
                      marginBottom: 4,
                      backgroundColor: feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
                      borderWidth: 1,
                      borderColor: feedback.type === "success" ? "#a7f3d0" : "#fecaca",
                    }}
                  >
                    <Text
                      style={{
                        color: feedback.type === "success" ? "#065f46" : "#b91c1c",
                        fontSize: 13,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    >
                      {feedback.type === "success" ? `✓ ${feedback.msg}` : feedback.msg}
                    </Text>
                  </View>
                )}

                <View style={{ marginTop: 8 }}>
                  <Button
                    title={saving ? "Saving preferences..." : "Save preferences"}
                    onPress={save}
                    loading={saving}
                  />
                </View>
              </>
            )}
          </Card>

          {/* ── Saved Preferences List ── */}
          {loaded && (
            <Card className="mb-5 p-4">
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#0f172a",
                  }}
                >
                  Saved preferences
                </Text>
                {savedItems.length > 0 && (
                  <View
                    style={{
                      backgroundColor: "#ecfdf5",
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#a7f3d0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#047857",
                      }}
                    >
                      {savedItems.length} saved
                    </Text>
                  </View>
                )}
              </View>

              {savedItems.length === 0 ? (
                <Text style={{ fontSize: 13, color: "#64748b" }}>
                  No payment preferences saved yet. Configure an option above and tap Save preferences.
                </Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {savedItems.map((item) => (
                    <View
                      key={item.key}
                      style={{
                        backgroundColor: "#f8fafc",
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: item.isDefault ? "#a7f3d0" : "#e2e8f0",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                          }}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: "#0f172a",
                            marginTop: 2,
                          }}
                        >
                          {item.value}
                        </Text>
                      </View>
                      {item.isDefault && (
                        <View
                          style={{
                            backgroundColor: "#d1fae5",
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "800",
                              color: "#065f46",
                            }}
                          >
                            Default
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )}

          {/* ── Sign out ── */}
          <Card className="p-4">
            <Button variant="outline" title="Sign out" onPress={logout} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
