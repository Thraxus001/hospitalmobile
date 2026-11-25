export type User = { id: number; full_name: string; phone: string; email: string | null; role: string };

export type Department = {
  id: number;
  name: string;
  icon: string | null;
  active: boolean;
  doctor_count: number;
};

export type Doctor = {
  id: number;
  full_name: string;
  specialty: string;
  hospital_location: string;
  rating: number;
  slot_minutes: number;
  consultation_fee: number;
  working_days: number[]; // 0 = Monday
  has_slots_today: boolean;
  max_daily_appointments?: number;
};

export type Slot = { start_at: string; end_at: string };

export type AppointmentStatus =
  | "pending_payment" | "confirmed" | "completed" | "no_show" | "rescheduled" | "cancelled";

export type Appointment = {
  id: number;
  doctor_id: number;
  doctor: Doctor;
  patient?: User | null;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  priority: number; // 0 emergency, 1 high, 2 normal
  fee: number;
  amount_due: number;
  hold_expires_at: string | null;
  rescheduled_from_id: number | null;
};

export type Notif = {
  id: number;
  kind: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  appointment_id: number | null;
  created_at: string;
  read_at: string | null;
};

export type HospitalSettings = {
  payment_methods: string[];   // e.g. ["mpesa", "card", "insurance"]
  insurance_providers: string[];
};

export type UserPaymentPref = {
  preferred_method: string | null;
  insurance_provider: string | null;
  insurance_member_no: string | null;
  mpesa_phone: string | null;
};

export type ReferralCode = {
  id: number;
  code: string;
  patient_id: number;
  doctor_id: number;
  used: boolean;
  used_at: string | null;
  created_at: string;
  patient_name: string;
  doctor_name: string;
};
