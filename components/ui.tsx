import { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const Screen = ({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) => (
  <SafeAreaView
    className={className}
    style={[{ flex: 1, backgroundColor: "#f8fafc" }, style]}
    edges={["top", "left", "right"]}
  >
    {children}
  </SafeAreaView>
);

export const Card = ({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) => (
  <View
    className={className}
    style={[
      {
        borderRadius: 16,
        backgroundColor: "#ffffff",
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
      style,
    ]}
  >
    {children}
  </View>
);

type BtnProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "danger";
};

export const Button = ({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
}: BtnProps) => {
  const isDisabled = Boolean(disabled || loading);
  const palette = {
    primary: {
      bg: "#059669",
      bgPressed: "#047857",
      border: "#059669",
      text: "#ffffff",
      spinner: "#ffffff",
    },
    outline: {
      bg: "#ffffff",
      bgPressed: "#f1f5f9",
      border: "#cbd5e1",
      text: "#1e293b",
      spinner: "#059669",
    },
    danger: {
      bg: "#ffffff",
      bgPressed: "#fef2f2",
      border: "#fca5a5",
      text: "#dc2626",
      spinner: "#dc2626",
    },
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={{
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: palette.bg,
        borderWidth: variant === "primary" ? 0 : 1,
        borderColor: palette.border,
        opacity: isDisabled ? 0.55 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={palette.spinner} />
      ) : (
        <Text style={{ color: palette.text, fontWeight: "700", fontSize: 15 }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export const Field = ({
  label,
  style,
  ...props
}: TextInputProps & { label: string }) => (
  <View style={{ marginBottom: 16 }}>
    <Text
      style={{
        marginBottom: 6,
        fontSize: 13,
        fontWeight: "600",
        color: "#475569",
      }}
    >
      {label}
    </Text>
    <TextInput
      placeholderTextColor="#94a3b8"
      style={[
        {
          height: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#cbd5e1",
          backgroundColor: "#ffffff",
          paddingHorizontal: 16,
          fontSize: 15,
          color: "#0f172a",
        },
        style,
      ]}
      {...props}
    />
  </View>
);

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  pending_payment: { bg: "#fef3c7", text: "#92400e" },
  confirmed: { bg: "#d1fae5", text: "#065f46" },
  completed: { bg: "#e2e8f0", text: "#334155" },
  no_show: { bg: "#fee2e2", text: "#b91c1c" },
  rescheduled: { bg: "#dbeafe", text: "#1d4ed8" },
  cancelled: { bg: "#e2e8f0", text: "#64748b" },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const c = BADGE_COLORS[status] ?? { bg: "#e2e8f0", text: "#334155" };
  return (
    <View
      style={{
        backgroundColor: c.bg,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: c.text, fontSize: 12, fontWeight: "600" }}>
        {status.replace("_", " ")}
      </Text>
    </View>
  );
};
