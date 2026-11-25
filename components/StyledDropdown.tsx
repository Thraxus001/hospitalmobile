import { Text, TouchableOpacity, View } from "react-native";

interface StyledDropdownProps {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  headerTitle?: string;
  clearLabel?: string;
  onClear?: () => void;
}

export function StyledDropdown({
  label,
  placeholder,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  headerTitle,
  clearLabel,
  onClear,
}: StyledDropdownProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: "#374151",
          marginBottom: 6,
        }}
      >
        {label}
      </Text>

      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.85}
        style={{
          height: 52,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: isOpen ? "#059669" : "#cbd5e1",
          backgroundColor: "#ffffff",
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flex: 1,
            paddingRight: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: value ? "#0f172a" : "#94a3b8",
              fontWeight: value ? "700" : "400",
            }}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            color: "#64748b",
            fontWeight: "700",
          }}
        >
          {isOpen ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View
          style={{
            marginTop: 6,
            borderRadius: 14,
            backgroundColor: "#ffffff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <View
            style={{
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: "#cbd5e1",
              backgroundColor: "#ffffff",
              overflow: "hidden",
            }}
          >
            {headerTitle ? (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  backgroundColor: "#f8fafc",
                  borderBottomWidth: 1,
                  borderBottomColor: "#f1f5f9",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {headerTitle}
                </Text>
              </View>
            ) : null}

            {options.map((item, idx) => {
              const isSelected = value === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: isSelected ? "#ecfdf5" : "#ffffff",
                    borderBottomWidth: idx < options.length - 1 ? 1 : 0,
                    borderBottomColor: "#f1f5f9",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                      paddingRight: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: isSelected ? "#059669" : "#cbd5e1",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        color: isSelected ? "#065f46" : "#334155",
                        fontWeight: isSelected ? "800" : "500",
                        flexShrink: 1,
                      }}
                    >
                      {item}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text
                      style={{
                        color: "#059669",
                        fontWeight: "800",
                        fontSize: 12,
                      }}
                    >
                      Selected
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {value && onClear ? (
              <TouchableOpacity
                onPress={onClear}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  backgroundColor: "#fef2f2",
                  borderTopWidth: 1,
                  borderTopColor: "#fee2e2",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#dc2626",
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {clearLabel || "Clear Selection"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}
