import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";

type Field = { name: string; phone: string; email: string; password: string };

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  autoCapitalize?: any;
}) {
  const [showPw, setShowPw] = useState(false);
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: "#374151",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <View style={{ position: "relative" }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !showPw}
          autoCapitalize={autoCapitalize ?? "words"}
          style={{
            height: 52,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: "#e2e8f0",
            backgroundColor: "#f8fafc",
            paddingHorizontal: 16,
            paddingRight: secureTextEntry ? 60 : 16,
            fontSize: 16,
            color: "#0f172a",
          }}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPw((p) => !p)}
            style={{
              position: "absolute",
              right: 14,
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}
          >
            <Text
              style={{ color: "#059669", fontWeight: "700", fontSize: 13 }}
            >
              {showPw ? "Hide" : "Show"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function Register() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<Field>({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Field) => (v: string) =>
    setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setBusy(true);
    try {
      await register(f.name, f.phone, f.password, f.email);
    } catch (e: any) {
      Alert.alert("Could not register", e.message);
    } finally {
      setBusy(false);
    }
  };

  const canSubmit =
    !!f.name && !!f.phone && f.password.length >= 8 && !busy;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#ffffff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top banner */}
        <View
          style={{
            height: 150,
            backgroundColor: "#065f46",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 28,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: "800",
              marginTop: 4,
            }}
          >
            Create account
          </Text>
          <Text style={{ color: "#6ee7b7", fontSize: 14, marginTop: 4 }}>
            Join thousands of patients
          </Text>
        </View>

        {/* Form card */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#fff",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -20,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 12,
          }}
        >
          <InputField
            label="Full name"
            value={f.name}
            onChangeText={set("name")}
            placeholder="Jane Doe"
          />
          <InputField
            label="Phone number"
            value={f.phone}
            onChangeText={set("phone")}
            placeholder="07XX XXX XXX"
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <InputField
            label="Email (optional)"
            value={f.email}
            onChangeText={set("email")}
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="Password (8+ characters)"
            value={f.password}
            onChangeText={set("password")}
            placeholder="Create a strong password"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>
      </ScrollView>

      {/* Pinned bottom action bar — always visible while typing */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <TouchableOpacity
          onPress={submit}
          disabled={!canSubmit}
          activeOpacity={0.85}
          style={{
            height: 54,
            borderRadius: 16,
            backgroundColor: canSubmit ? "#059669" : "#94a3b8",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#059669",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: canSubmit ? 0.3 : 0,
            shadowRadius: 12,
            elevation: canSubmit ? 6 : 0,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontWeight: "800",
              fontSize: 16,
            }}
          >
            {busy ? "Creating account…" : "Create account"}
          </Text>
        </TouchableOpacity>

        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#64748b", fontSize: 14 }}>
            Have an account?{" "}
          </Text>
          <Link href="/(auth)/login">
            <Text
              style={{ color: "#059669", fontWeight: "700", fontSize: 14 }}
            >
              Sign in
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
