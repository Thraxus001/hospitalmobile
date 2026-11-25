import { useState } from "react";
import {
  Alert,
  Image,
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

export default function Login() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await login(phone, password);
    } catch (e: any) {
      Alert.alert("Login failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = !!phone && !!password && !busy;

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
        {/* Top banner with hero image */}
        <View style={{ height: 220, backgroundColor: "#0f4c81", overflow: "hidden" }}>
          <Image
            source={require("../../assets/hero-banner.png")}
            style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.35 }}
            resizeMode="cover"
          />
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 28,
            }}
          >
            <Image
              source={require("../../assets/icons/logo.png")}
              style={{ width: 64, height: 64, borderRadius: 18, marginBottom: 10 }}
              resizeMode="contain"
            />
            <Text
              style={{ color: "#fff", fontSize: 25, fontWeight: "800", letterSpacing: -0.5 }}
            >
              Clinic Booking
            </Text>
            <Text style={{ color: "#93c5fd", fontSize: 14, marginTop: 4 }}>
              Your health, one tap away
            </Text>
          </View>
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
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 4 }}>
            Welcome back
          </Text>
          <Text style={{ color: "#64748b", fontSize: 15, marginBottom: 24 }}>
            Sign in to manage your appointments
          </Text>

          {/* Phone */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
            Phone number
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="07XX XXX XXX"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            style={{
              height: 52,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: "#e2e8f0",
              backgroundColor: "#f8fafc",
              paddingHorizontal: 16,
              fontSize: 16,
              color: "#0f172a",
              marginBottom: 16,
            }}
          />

          {/* Password */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 }}>
            Password
          </Text>
          <View style={{ position: "relative", marginBottom: 8 }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPw}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (canSubmit) submit();
              }}
              style={{
                height: 52,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: "#e2e8f0",
                backgroundColor: "#f8fafc",
                paddingHorizontal: 16,
                paddingRight: 72,
                fontSize: 16,
                color: "#0f172a",
              }}
            />
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
              <Text style={{ color: "#059669", fontWeight: "700", fontSize: 13 }}>
                {showPw ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Pinned bottom action bar — always visible even with keyboard open */}
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
          <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 16 }}>
            {busy ? "Signing in…" : "Sign in"}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "center" }}>
          <Text style={{ color: "#64748b", fontSize: 14 }}>New here? </Text>
          <Link href="/(auth)/register">
            <Text style={{ color: "#059669", fontWeight: "700", fontSize: 14 }}>
              Create account
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
