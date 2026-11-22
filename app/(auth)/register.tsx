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
  View,
} from "react-native";
import { Link } from "expo-router";
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
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top banner */}
        <View
          style={{
            height: 180,
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
            paddingTop: 32,
            paddingBottom: 40,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 10,
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

          {/* Submit */}
          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            style={({ pressed }) => ({
              height: 54,
              borderRadius: 16,
              backgroundColor: canSubmit ? "#059669" : "#d1fae5",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.88 : 1,
              marginTop: 8,
              shadowColor: "#059669",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: canSubmit ? 0.35 : 0,
              shadowRadius: 12,
              elevation: canSubmit ? 6 : 0,
            })}
          >
            <Text
              style={{
                color: canSubmit ? "#fff" : "#6ee7b7",
                fontWeight: "800",
                fontSize: 16,
              }}
            >
              {busy ? "Creating account…" : "Create account"}
            </Text>
          </Pressable>

          <View
            style={{
              marginTop: 24,
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#64748b", fontSize: 15 }}>
              Have an account?{" "}
            </Text>
            <Link href="/(auth)/login">
              <Text
                style={{ color: "#059669", fontWeight: "700", fontSize: 15 }}
              >
                Sign in
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
