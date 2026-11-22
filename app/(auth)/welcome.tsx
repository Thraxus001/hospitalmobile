import { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Your Health,\nSimplified.",
    subtitle:
      "Find the right specialist, book in seconds, and manage all your appointments in one place.",
    image: require("../../assets/hero-banner.png"),
    bg: "#0f4c81",
    accent: "#60a5fa",
  },
  {
    id: "2",
    title: "Top Doctors,\nNear You.",
    subtitle:
      "Browse verified specialists across cardiology, neurology, pediatrics and more — all rated by real patients.",
    image: require("../../assets/doctor-banner.png"),
    bg: "#065f46",
    accent: "#6ee7b7",
  },
  {
    id: "3",
    title: "Pay Securely,\nYour Way.",
    subtitle:
      "Use M-Pesa, card, or insurance. Payments are protected and receipts are always available.",
    image: require("../../assets/pay-banner.png"),
    bg: "#4c1d95",
    accent: "#c4b5fd",
  },
];

export default function Welcome() {
  const router = useRouter();
  const ref = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);

  const goToSlide = (index: number) => {
    if (index < 0 || index >= SLIDES.length) return;
    setCurrent(index);
    ref.current?.scrollToOffset({ offset: index * width, animated: true });
  };

  const next = () => {
    if (current < SLIDES.length - 1) {
      goToSlide(current + 1);
    } else {
      router.replace("/(auth)/login");
    }
  };

  const slide = SLIDES[current] ?? SLIDES[0];

  return (
    <View style={{ flex: 1, backgroundColor: slide.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={slide.bg} />

      {/* Top bar with Skip button */}
      <View
        style={{
          position: "absolute",
          top: 48,
          right: 20,
          zIndex: 30,
        }}
      >
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: 20,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Full-screen carousel */}
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          if (newIndex >= 0 && newIndex < SLIDES.length) {
            setCurrent(newIndex);
          }
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            ref.current?.scrollToOffset({
              offset: info.index * width,
              animated: true,
            });
          }, 100);
        }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        renderItem={({ item }) => (
          <View style={{ width, height, backgroundColor: item.bg }}>
            {/* Hero image — top 60% */}
            <Image
              source={item.image}
              style={{ width, height: height * 0.6, opacity: 0.8 }}
              resizeMode="cover"
            />
            {/* Fade overlay at bottom of image */}
            <View
              style={{
                position: "absolute",
                top: height * 0.32,
                left: 0,
                right: 0,
                height: height * 0.3,
                backgroundColor: item.bg,
                opacity: 0.92,
              }}
            />
          </View>
        )}
      />

      {/* Content overlay */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 28,
          paddingBottom: 48,
          zIndex: 20,
        }}
      >
        {/* Progress dots - clickable */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {SLIDES.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => goToSlide(i)}
              hitSlop={10}
              style={{
                height: 6,
                width: i === current ? 32 : 10,
                borderRadius: 4,
                backgroundColor: i === current ? slide.accent : "#ffffff40",
              }}
            />
          ))}
        </View>

        <Text
          style={{
            fontSize: 36,
            fontWeight: "800",
            color: "#fff",
            lineHeight: 42,
            letterSpacing: -0.5,
          }}
        >
          {slide.title}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#ffffffbb",
            lineHeight: 22,
            marginTop: 12,
            marginBottom: 32,
          }}
        >
          {slide.subtitle}
        </Text>

        {/* CTA Next / Get started button */}
        <Pressable
          onPress={next}
          style={({ pressed }) => ({
            height: 56,
            borderRadius: 16,
            backgroundColor: slide.accent,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
            shadowColor: slide.accent,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 10,
          })}
        >
          <Text style={{ color: "#000", fontWeight: "800", fontSize: 17 }}>
            {current === SLIDES.length - 1 ? "Get started →" : "Next →"}
          </Text>
        </Pressable>

        {/* Sign in link */}
        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          style={{ marginTop: 18, alignItems: "center", paddingVertical: 4 }}
        >
          <Text style={{ color: "#ffffff80", fontSize: 14 }}>
            Already have an account?{" "}
            <Text style={{ color: "#fff", fontWeight: "700" }}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
