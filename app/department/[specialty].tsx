import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api, money } from "../../lib/api";
import type { Doctor } from "../../lib/types";
import { Card } from "../../components/ui";
import { getDepartmentImage } from "../../lib/departmentImages";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type DeptInfo = {
  tagline: string;
  description: string;
  treatments: string[];
  whenToConsult: string[];
  diagnosticServices: string[];
  color: string;
  accent: string;
};

const DEPARTMENT_DATA: Record<string, DeptInfo> = {
  Cardiology: {
    tagline: "Heart & Cardiovascular Health",
    description:
      "Our Cardiology department provides expert clinical evaluation, diagnosis, and non-invasive treatment for diseases of the heart, blood vessels, and circulatory system.",
    treatments: [
      "High Blood Pressure (Hypertension)",
      "Heart Palpitations & Arrhythmias",
      "Chest Pain & Angina Evaluation",
      "Coronary Artery Disease",
      "Heart Failure Management",
      "Cholesterol & Lipid Disorders",
    ],
    whenToConsult: [
      "Chest tightness, pressure, or unexplained pain",
      "Shortness of breath during normal daily activities",
      "Irregular or racing heartbeat / palpitations",
      "Uncontrolled high blood pressure or family heart history",
    ],
    diagnosticServices: ["ECG / EKG", "Echocardiogram", "Stress Testing", "Holter Monitor"],
    color: "#fef2f2",
    accent: "#ef4444",
  },
  Dermatology: {
    tagline: "Skin, Hair & Nail Care",
    description:
      "Comprehensive medical dermatology providing diagnosis and therapy for acute and chronic conditions affecting skin, scalp, hair, and nails for all age groups.",
    treatments: [
      "Acne & Chronic Facial Breakouts",
      "Eczema, Atopic Dermatitis & Psoriasis",
      "Suspicious Moles & Skin Lesions",
      "Severe Rashes & Allergic Hives",
      "Hair Loss (Alopecia) & Scalp Disorders",
      "Fungal, Bacterial & Viral Skin Infections",
    ],
    whenToConsult: [
      "Moles changing in shape, size, color, or bleeding",
      "Persistent rash that does not respond to OTC creams",
      "Severe or scarring cystic acne",
      "Sudden patchy hair loss or unexplained skin discoloration",
    ],
    diagnosticServices: ["Skin Biopsy", "Mole Mapping", "Allergy Patch Tests", "Cryotherapy"],
    color: "#f0fdf4",
    accent: "#10b981",
  },
  Neurology: {
    tagline: "Brain, Spine & Nervous System",
    description:
      "Specialized neurological care diagnosing and managing complex disorders of the central and peripheral nervous systems, including the brain, spinal cord, and nerves.",
    treatments: [
      "Chronic Migraines & Tension Headaches",
      "Epilepsy, Seizures & Loss of Consciousness",
      "Stroke Recovery & Prevention",
      "Peripheral Neuropathy & Nerve Pain",
      "Memory Loss, Dementia & Alzheimer's",
      "Tremors, Parkinson's & Movement Disorders",
    ],
    whenToConsult: [
      "Frequent severe headaches or migraines",
      "Unexplained numbness, tingling, or weakness in limbs",
      "Tremors, involuntary shaking, or balance issues",
      "Sudden episodes of confusion or memory blackouts",
    ],
    diagnosticServices: ["EEG Monitoring", "Nerve Conduction (NCS)", "EMG", "Cognitive Screenings"],
    color: "#faf5ff",
    accent: "#8b5cf6",
  },
  Orthopedics: {
    tagline: "Bones, Joints & Musculoskeletal Care",
    description:
      "Orthopedic specialists delivering targeted care for bone fractures, joint pain, spine issues, ligament tears, and sports-related injuries.",
    treatments: [
      "Bone Fractures, Sprains & Dislocations",
      "Osteoarthritis & Joint Pain (Knee, Hip, Shoulder)",
      "Chronic Lower Back Pain & Sciatica",
      "Sports Injuries (ACL, Meniscus Tears)",
      "Tendonitis, Bursitis & Carpal Tunnel Syndrome",
      "Neck Stiffness & Postural Strain",
    ],
    whenToConsult: [
      "Inability to bear weight or walk without severe pain",
      "Joint swelling, stiffness, or visible deformity",
      "Persistent back or neck pain radiating to legs or arms",
      "Acute injury following a sports accident or fall",
    ],
    diagnosticServices: ["X-Ray Review", "Joint Injections", "Cast & Splint Care", "Rehab Planning"],
    color: "#fffbeb",
    accent: "#f59e0b",
  },
  Pediatrics: {
    tagline: "Infant, Child & Adolescent Health",
    description:
      "Dedicated, compassionate healthcare tailored to the unique physiological, developmental, and emotional needs of children from birth through adolescence.",
    treatments: [
      "Well-Baby Exams & Developmental Milestones",
      "Childhood Immunizations & Vaccine Schedules",
      "Acute Illnesses (Fever, Ear Infections, Coughs)",
      "Pediatric Asthma & Environmental Allergies",
      "Childhood Nutrition & Growth Monitoring",
      "Infant Colic, Reflux & Feeding Difficulties",
    ],
    whenToConsult: [
      "High or persistent fever in infants and young children",
      "Difficulty breathing, rapid breathing, or chest wheezing",
      "Unexplained lethargy, refusal to drink fluids, or dehydration",
      "Missed developmental or growth milestones",
    ],
    diagnosticServices: ["Growth Tracking", "Vaccination Records", "Pediatric Blood Panels", "Nebulizer Therapy"],
    color: "#fff7ed",
    accent: "#f97316",
  },
  "General Medicine": {
    tagline: "Primary Care & Chronic Disease Management",
    description:
      "Primary care physicians serving as your first line of healthcare, handling acute medical conditions, routine physicals, and long-term chronic illness management.",
    treatments: [
      "Comprehensive Annual Health Physicals",
      "Acute Fevers, Flu, Typhoid & Malaria",
      "Type 2 Diabetes Screening & Control",
      "Gastrointestinal Upsets & Stomach Ulcers",
      "Urinary Tract Infections (UTIs)",
      "Preventive Health & Lifestyle Consultation",
    ],
    whenToConsult: [
      "Lingering fatigue, unexplained weight changes, or body aches",
      "Persistent cough or fever lasting more than 3 days",
      "Routine prescription renewals and blood work reviews",
      "General feeling of illness requiring expert diagnosis",
    ],
    diagnosticServices: ["Full Blood Count (FBC)", "Blood Sugar Tests", "Urinalysis", "Lipid Panels"],
    color: "#eff6ff",
    accent: "#3b82f6",
  },
  Oncology: {
    tagline: "Comprehensive Cancer Care & Screening",
    description:
      "Compassionate, evidence-based oncology consultations focusing on cancer prevention, early detection, tumor staging, and personalized treatment planning.",
    treatments: [
      "Cancer Screening & Early Risk Assessments",
      "Tumor & Biopsy Review Consultations",
      "Chemotherapy & Targeted Therapy Counseling",
      "Cancer Pain & Supportive Palliative Care",
      "Post-Treatment Remission & Survivorship",
      "Second Opinion Oncology Evaluations",
    ],
    whenToConsult: [
      "Unexplained new lumps or swollen lymph nodes",
      "Unintentional rapid weight loss and severe night sweats",
      "Abnormal results from mammogram, Pap smear, or colonoscopy",
      "Need for a specialist consultation following a biopsy",
    ],
    diagnosticServices: ["Biopsy Reviews", "Tumor Marker Panels", "Staging Assessments", "Treatment Planning"],
    color: "#fdf2f8",
    accent: "#db2777",
  },
  Ophthalmology: {
    tagline: "Eye Care & Vision Health",
    description:
      "Specialized clinical care diagnosing, treating, and managing visual disorders, eye infections, glaucoma, and ocular diseases for clear vision.",
    treatments: [
      "Blurred Vision, Astigmatism & Refraction Issues",
      "Cataract & Glaucoma Screenings",
      "Diabetic Retinopathy Monitoring",
      "Dry Eye Syndrome & Corneal Irritation",
      "Conjunctivitis (Pink Eye) & Eye Allergies",
      "Foreign Body & Ocular Trauma Care",
    ],
    whenToConsult: [
      "Sudden blurriness, double vision, or visual distortion",
      "Persistent eye pain, redness, or unusual discharge",
      "Flashes of light or sudden onset of dark floaters",
      "Routine annual diabetic eye screening",
    ],
    diagnosticServices: ["Visual Acuity Tests", "Tonometry (Eye Pressure)", "Slit Lamp Exams", "Fundoscopy"],
    color: "#fdf4ff",
    accent: "#d946ef",
  },
  ENT: {
    tagline: "Ear, Nose & Throat (Otolaryngology)",
    description:
      "Expert medical care treating acute and chronic disorders affecting the ears, hearing, sinuses, nasal breathing, tonsils, and vocal cords.",
    treatments: [
      "Chronic Sinusitis & Nasal Polyps",
      "Ear Infections, Earwax Impaction & Swimmer's Ear",
      "Hearing Loss & Tinnitus (Ringing in Ears)",
      "Tonsillitis & Chronic Sore Throats",
      "Vertigo, Dizziness & Balance Disorders",
      "Vocal Cord Strain & Voice Hoarseness",
    ],
    whenToConsult: [
      "Persistent sinus congestion or facial pressure lasting weeks",
      "Sudden drop in hearing or constant ringing in ears",
      "Hoarseness or voice loss exceeding 2 weeks",
      "Recurrent severe tonsil infections",
    ],
    diagnosticServices: ["Audiometry (Hearing Tests)", "Nasal Endoscopy", "Ear Microsuction", "Tympanometry"],
    color: "#fefce8",
    accent: "#ca8a04",
  },
  Gynecology: {
    tagline: "Women's Health & Reproductive Care",
    description:
      "Dedicated, confidential healthcare addressing reproductive wellness, prenatal & postnatal care, menstrual health, and hormonal balance through all life stages.",
    treatments: [
      "Well-Woman Annual Exams & Pap Smears",
      "Prenatal, Antenatal & Postnatal Consultations",
      "Irregular, Painful, or Heavy Menstrual Periods",
      "PCOS, Fibroids & Endometriosis Care",
      "Family Planning & Contraceptive Counseling",
      "Menopause & Hormone Transition Guidance",
    ],
    whenToConsult: [
      "Irregular menstrual cycles or severe pelvic pain",
      "Planning a pregnancy or needing early prenatal care",
      "Unexplained vaginal bleeding or unusual discharge",
      "Routine Pap smear and cervical screening",
    ],
    diagnosticServices: ["Pelvic Ultrasound", "Pap Smears", "HPV Testing", "Hormonal Blood Panels"],
    color: "#fff1f2",
    accent: "#e11d48",
  },
};

// Fallback for any unexpected department
function getDepartmentInfo(name: string): DeptInfo {
  if (DEPARTMENT_DATA[name]) return DEPARTMENT_DATA[name];
  // Fuzzy match
  const key = Object.keys(DEPARTMENT_DATA).find(
    (k) => k.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(k.toLowerCase())
  );
  if (key && DEPARTMENT_DATA[key]) return DEPARTMENT_DATA[key];

  return {
    tagline: `${name} Specialty Care`,
    description: `Specialized medical department offering consultations, diagnosis, and treatment in ${name} by our certified clinical specialists.`,
    treatments: [
      `Specialist Clinical Consultations in ${name}`,
      `Diagnostic Evaluation & Treatment Protocols`,
      `Preventive Care & Health Screening`,
      `Follow-up Management & Prescription Reviews`,
    ],
    whenToConsult: [
      `Specialist referral from a primary care doctor`,
      `Persistent or worsening symptoms related to ${name}`,
      `Need for an expert second opinion`,
      `Routine checkup and clinical review`,
    ],
    diagnosticServices: ["Specialist Consultation", "Clinical Review", "Diagnostic Tests"],
    color: "#f8fafc",
    accent: "#059669",
  };
}

export default function DepartmentScreen() {
  const { specialty } = useLocalSearchParams<{ specialty: string }>();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [error, setError] = useState("");

  const deptInfo = getDepartmentInfo(specialty || "Department");
  const deptImg = getDepartmentImage(specialty);

  const handleReturn = () => {
    try {
      if (Platform.OS !== "web" && router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      router.replace("/(tabs)");
    }
  };

  const load = useCallback(async () => {
    if (!specialty) return;
    try {
      const docs = await api<Doctor[]>(`/doctors?specialty=${encodeURIComponent(specialty)}`);
      setDoctors(docs);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, [specialty]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#0f4c81",
          paddingTop: 52,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <Pressable
          onPress={handleReturn}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
            gap: 6,
            alignSelf: "flex-start",
            paddingVertical: 6,
            paddingHorizontal: 8,
            marginLeft: -8,
            borderRadius: 8,
            backgroundColor: pressed ? "rgba(255,255,255,0.12)" : "transparent",
            cursor: "pointer" as any,
          })}
        >
          <Text style={{ color: "#93c5fd", fontSize: 26, fontWeight: "400", lineHeight: 26 }}>
            ‹
          </Text>
          <Text style={{ color: "#93c5fd", fontSize: 15, fontWeight: "700" }}>
            Back to Departments
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {deptImg ? (
            <Image
              source={deptImg}
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 24,
                fontWeight: "800",
                letterSpacing: -0.5,
              }}
            >
              {specialty}
            </Text>
            <Text style={{ color: "#93c5fd", fontSize: 13, marginTop: 2 }}>
              {deptInfo.tagline}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Department Overview Card ── */}
        <Card className="mb-4 p-4 border border-slate-200">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 16 }}>ℹ️</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
              About This Department
            </Text>
          </View>
          <Text style={{ color: "#334155", fontSize: 14, lineHeight: 22 }}>
            {deptInfo.description}
          </Text>

          {/* Diagnostic Services Chips */}
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Available Services & Diagnostics:
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {deptInfo.diagnosticServices.map((s) => (
                <View
                  key={s}
                  style={{
                    backgroundColor: "#f1f5f9",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#334155", fontWeight: "600" }}>
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* ── 2. Conditions & What We Treat ── */}
        <Card className="mb-4 p-4 border border-slate-200">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
              What We Deal With
            </Text>
          </View>
          <Text style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>
            Specialists in {specialty} handle the diagnosis, treatment, and ongoing care for:
          </Text>

          <View style={{ gap: 8 }}>
            {deptInfo.treatments.map((t) => (
              <View
                key={t}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  backgroundColor: "#f8fafc",
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#059669", fontSize: 15, fontWeight: "800" }}>
                  •
                </Text>
                <Text style={{ flex: 1, fontSize: 13, color: "#1e293b", fontWeight: "600", lineHeight: 18 }}>
                  {t}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* ── 3. When to See a Specialist ── */}
        <View
          style={{
            backgroundColor: deptInfo.color,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: `${deptInfo.accent}33`,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#0f172a" }}>
              When to Consult a Specialist
            </Text>
          </View>
          <Text style={{ color: "#475569", fontSize: 12, marginBottom: 10 }}>
            You should book a session if you experience any of the following:
          </Text>
          {deptInfo.whenToConsult.map((c, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <Text style={{ color: deptInfo.accent, fontSize: 14, fontWeight: "800" }}>
                •
              </Text>
              <Text style={{ flex: 1, fontSize: 13, color: "#334155", lineHeight: 18 }}>
                {c}
              </Text>
            </View>
          ))}
        </View>

        {/* ── 4. Specialists & Booking Section ── */}
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>
              Book a Specialist
            </Text>
            <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>
              {doctors ? `${doctors.length} available` : "Loading…"}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            Select an expert doctor to pick a slot and book your session
          </Text>
        </View>

        {error ? (
          <View style={{ padding: 16, backgroundColor: "#fee2e2", borderRadius: 12 }}>
            <Text style={{ color: "#dc2626", fontWeight: "600" }}>{error}</Text>
          </View>
        ) : !doctors ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <ActivityIndicator color="#059669" size="large" />
            <Text style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>
              Loading available specialists…
            </Text>
          </View>
        ) : doctors.length === 0 ? (
          <Card className="p-6 items-center">
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b", textAlign: "center" }}>
              No specialists currently available
            </Text>
            <Text style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 16 }}>
              There are currently no active doctors scheduled in {specialty}. You can consult a General Practitioner or check all doctors.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <Pressable
                onPress={handleReturn}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#e2e8f0" : "#f1f5f9",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  cursor: "pointer" as any,
                })}
              >
                <Text style={{ color: "#334155", fontWeight: "700" }}>‹ All Departments</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/find-doctor")}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#047857" : "#059669",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  cursor: "pointer" as any,
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Browse All Doctors</Text>
              </Pressable>
            </View>
          </Card>
        ) : (
          <View style={{ gap: 14 }}>
            {doctors.map((d) => (
              <Card key={d.id} className="p-4 border border-slate-200">
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>
                      {d.full_name}
                    </Text>
                    <Text style={{ color: "#059669", fontWeight: "600", fontSize: 13, marginTop: 2 }}>
                      {d.specialty} Specialist
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                      {d.hospital_location}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
                      {money(d.consultation_fee)}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#d97706", fontWeight: "700", marginTop: 2 }}>
                      {d.rating.toFixed(1)} / 5.0
                    </Text>
                    {d.has_slots_today ? (
                      <View
                        style={{
                          marginTop: 4,
                          backgroundColor: "#ecfdf5",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#a7f3d0",
                        }}
                      >
                        <Text style={{ color: "#047857", fontSize: 11, fontWeight: "700" }}>
                          Free today
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={{
                          marginTop: 4,
                          backgroundColor: "#f1f5f9",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>
                          Check slots
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Working days tags */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 12,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#f1f5f9",
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "600" }}>
                    Days:
                  </Text>
                  {d.working_days.map((w) => (
                    <View
                      key={w}
                      style={{
                        backgroundColor: "#f0fdf4",
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: "#bbf7d0",
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#166534" }}>
                        {WEEK[w]}
                      </Text>
                    </View>
                  ))}
                  <Text style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
                    {d.slot_minutes} min visits
                  </Text>
                </View>

                {/* Explicit Book Session CTA Button */}
                <Pressable
                  onPress={() => router.push(`/doctor/${d.id}`)}
                  style={({ pressed }) => ({
                    marginTop: 14,
                    height: 46,
                    borderRadius: 12,
                    backgroundColor: "#059669",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                    opacity: pressed ? 0.85 : 1,
                    shadowColor: "#059669",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 3,
                  })}
                >
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                    Book Session with {d.full_name.split(" ")[1] ?? "Doctor"}
                  </Text>
                  <Text style={{ color: "#fff", fontSize: 16 }}>→</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        )}

        {/* Bottom Return to Departments CTA */}
        <View style={{ marginTop: 28, alignItems: "center" }}>
          <Pressable
            onPress={handleReturn}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 12,
              paddingHorizontal: 22,
              borderRadius: 14,
              backgroundColor: pressed ? "#e2e8f0" : "#ffffff",
              borderWidth: 1.5,
              borderColor: "#cbd5e1",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              cursor: "pointer" as any,
            })}
          >
            <Text style={{ color: "#0f4c81", fontSize: 18, fontWeight: "800" }}>‹</Text>
            <Text style={{ color: "#0f4c81", fontSize: 14, fontWeight: "700" }}>
              Back to All Departments
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
