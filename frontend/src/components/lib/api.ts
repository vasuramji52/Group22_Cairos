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

/* ---------- Availability API ---------- */

// Minimal, typed wrapper around GET /api/availability/first

export interface AvailabilityFirstParams {
  userA: string;
  userB: string;

  // full window in ISO strings (built in the component)
  start: string;          // ISO
  end: string;            // ISO

  tz: string;             // IANA tz, e.g. "America/New_York"
  minutes: number;        // meeting duration in minutes

  workStart: string;      // "HH:mm" (e.g. "09:00")
  workEnd: string;        // "HH:mm" (e.g. "17:00")
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

export async function availabilityFirst(
  params: AvailabilityFirstParams
): Promise<AvailabilityFirstResponse> {
  const {
    userA,
    userB,
    start,
    end,
    tz,
    minutes,
    workStart,
    workEnd,
  } = params;

  // convert "09:00" -> "9", "17:00" -> "17"
  const workStartHour = workStart.split(":")[0];
  const workEndHour   = workEnd.split(":")[0];

  const qs = new URLSearchParams({
    userA,
    userB,
    minutes: String(minutes),
    start,                     // already ISO
    end,                       // already ISO
    tz,
    workStart: String(Number(workStartHour)), // "09" -> "9"
    workEnd:   String(Number(workEndHour)),   // "17" -> "17"
  });

  console.log("🔵 availabilityFirst → sending:", {
    userA,
    userB,
    start,
    end,
    tz,
    minutes,
    workStart,
    workEnd,
    url: `/api/availability/first?${qs.toString()}`,
  });

  const res = await api(`/api/availability/first?${qs.toString()}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json();
}

export interface BookMeetingParams {
  userA: string;
  userB: string;
  start: string; // ISO
  end: string;   // ISO
  tz: string;
  summary?: string;
  description?: string;
}

export async function bookMeeting(params: BookMeetingParams) {
  const res = await api("/api/availability/book", {
    method: "POST",
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Booking failed (${res.status})`);
  }

  return res.json(); // { ok: true }
}

