import { Platform } from 'react-native';

const getBaseUrl = () => {
  // If running in a web browser, use localhost
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }
  // If running on a true Android emulator
  return process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000';
};

export const API_URL = getBaseUrl();

let token: string | null = null;
export const setToken = (t: string | null) => { token = t; };

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T = unknown>(
  path: string,
  opts: { body?: unknown; method?: string } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: opts.body ? (opts.method ?? "POST") : (opts.method ?? "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = typeof j.detail === "string" ? j.detail : j.detail?.[0]?.msg ?? msg;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

// ---- Time helpers: the hospital runs on East Africa Time (UTC+3, no DST) ----
const EAT_MS = 3 * 3600 * 1000;
const pad = (n: number) => String(n).padStart(2, "0");

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const eatParts = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + EAT_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate(), wd: d.getUTCDay(), h: d.getUTCHours(), min: d.getUTCMinutes() };
};

/** YYYY-MM-DD for "today + offset days" in EAT */
export const eatDateKey = (offsetDays = 0): string =>
  new Date(Date.now() + EAT_MS + offsetDays * 86400000).toISOString().slice(0, 10);

export const fmtTime = (iso: string) => { const p = eatParts(iso); return `${pad(p.h)}:${pad(p.min)}`; };
export const fmtDate = (iso: string) => { const p = eatParts(iso); return `${DAYS[p.wd]} ${p.day} ${MONTHS[p.m]}`; };
export const fmtDateTime = (iso: string) => `${fmtDate(iso)} ${fmtTime(iso)}`;

export const dayChip = (key: string): { dow: string; num: string; mon: string; monWd: number } => {
  const d = new Date(`${key}T00:00:00Z`);
  const wd = d.getUTCDay();
  return {
    dow: DAYS[wd],
    num: String(d.getUTCDate()),
    mon: MONTHS[d.getUTCMonth()],
    monWd: (wd + 6) % 7,
  };
};

export const money = (n: number) =>
  `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
