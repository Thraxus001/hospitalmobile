import { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const Screen = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <SafeAreaView className={`flex-1 bg-slate-50 ${className}`} edges={["top", "left", "right"]}>{children}</SafeAreaView>
);

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <View className={`rounded-2xl bg-white p-4 shadow-sm border border-slate-100 ${className}`}>{children}</View>
);

type BtnProps = { title: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: "primary" | "outline" | "danger" };
export const Button = ({ title, onPress, loading, disabled, variant = "primary" }: BtnProps) => {
  const styles = {
    primary: "bg-brand-600 active:bg-brand-700",
    outline: "bg-white border border-slate-300 active:bg-slate-100",
    danger: "bg-white border border-red-300 active:bg-red-50",
  }[variant];
  const text = { primary: "text-white", outline: "text-slate-800", danger: "text-red-600" }[variant];
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} className={`h-12 items-center justify-center rounded-xl ${styles} ${disabled ? "opacity-50" : ""}`}>
      {loading ? <ActivityIndicator color={variant === "primary" ? "#fff" : variant === "danger" ? "#dc2626" : "#059669"} /> : <Text className={`font-semibold ${text}`}>{title}</Text>}
    </Pressable>
  );
};

export const Field = ({ label, ...props }: TextInputProps & { label: string }) => (
  <View className="mb-4">
    <Text className="mb-1 text-sm font-medium text-slate-600">{label}</Text>
    <TextInput placeholderTextColor="#94a3b8" className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900" {...props} />
  </View>
);

const BADGES: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-200 text-slate-700",
  no_show: "bg-red-100 text-red-700",
  rescheduled: "bg-blue-100 text-blue-700",
  cancelled: "bg-slate-200 text-slate-500",
};
export const StatusBadge = ({ status }: { status: string }) => (
  <Text className={`overflow-hidden rounded-full px-3 py-1 text-xs font-semibold ${BADGES[status] ?? ""}`}>
    {status.replace("_", " ")}
  </Text>
);
