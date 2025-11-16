const API = import.meta.env.VITE_BACKEND_URL;

export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token_data"); // saved by storeToken(...)
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) {
    // not logged in / token invalid → bounce to login
    localStorage.removeItem("token_data");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  return res;
}

export async function getMeReal() {
  const res = await api("/api/me");
  const data = await res.json(); // { user: {...} }
  return data.user;
}

// Minimal, typed wrapper around GET /api/availability/first

export interface AvailabilityFirstParams {
  userA: string;
  userB: string;
  date: string;          // yyyy-mm-dd
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
  tz: string;            // IANA tz, e.g. "America/New_York"
  minutes: number;       // meeting duration
  workStart: string;     // HH:mm
  workEnd: string;       // HH:mm
  baseUrl?: string;      // override if not localhost
}

export interface TimeSlot {
  start: string; // ISO
  end: string;   // ISO
}

export interface AvailabilityFirstResponse {
  // Your backend may return any of these shapes:
  firstSlot?: TimeSlot;
  slotStart?: string;
  slotEnd?: string;
  slots?: TimeSlot[];
  error?: string;
}


export async function availabilityFirst(params: AvailabilityFirstParams): Promise<AvailabilityFirstResponse> {
  const {
    userA, userB, date, startTime, endTime, tz, minutes, workStart, workEnd,
    baseUrl = "http://localhost:5000",
  } = params;

  const startISO = new Date(`${date}T${startTime}:00`).toISOString();
  const endISO   = new Date(`${date}T${endTime}:00`).toISOString();

  // convert "09:00" -> "9", "17:00" -> "17"
  const workStartHour = workStart.split(":")[0]; // "09" -> "09"
  const workEndHour   = workEnd.split(":")[0];   // "17" -> "17"

  const qs = new URLSearchParams({
    userA,
    userB,
    minutes: String(minutes),
    start: startISO,
    end: endISO,
    tz,
    workStart: String(Number(workStartHour)), // "09" -> "9"
    workEnd:   String(Number(workEndHour)),   // "17" -> "17"
  });

  console.log("🔵 availabilityFirst → sending:", {
  userA,
  userB,
  date,
  startTime,
  endTime,
  tz,
  minutes,
  workStart,
  workEnd,
  url: `/api/availability/first?${params.toString()}`
});

  const res = await fetch(`${baseUrl}/api/availability/first?${qs.toString()}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json();
}


