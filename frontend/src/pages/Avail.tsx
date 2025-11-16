import React, { useMemo, useState } from "react";


const TZ_OPTIONS = [
  "America/New_York",
  "UTC",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

// Mock users shown to the user
const MOCK_ME = { id: "000000000000000000000001", name: "You" };
const MOCK_FRIENDS = [
  { id: "000000000000000000000002", name: "Vaishu" },
  { id: "000000000000000000000003", name: "Pradha" },
];

export default function AvailabilityFriendPickerMock() {
  // default dates (date-only strings yyyy-mm-dd)
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const oneWeekOut = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [friend, setFriend] = useState(MOCK_FRIENDS[0].id);
  const [minutes, setMinutes] = useState<number>(30);
  const [tz, setTz] = useState<string>("America/New_York");
  const [start, setStart] = useState<string>(today); // date-only
  const [end, setEnd] = useState<string>(oneWeekOut); // date-only
  const [workStart, setWorkStart] = useState<string>("09:00");
  const [workEnd, setWorkEnd] = useState<string>("17:00");

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Find a time with a friend</h1>
          <p className="text-sm text-slate-600">
            Pick a friend, select your date window (dates only) and working hours. This page doesn't call anything — it's just the UI.
          </p>
        </header>

        {/* People */}
        <div className="rounded-2xl bg-white p-4 shadow mb-4">
          <h2 className="mb-2 text-lg font-medium">People</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">You</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-100 p-2 text-slate-700"
                value={`${MOCK_ME.name} — ${MOCK_ME.id}`}
                readOnly
              />
              <p className="mt-1 text-xs text-slate-500">Your internal user ID (fixed).</p>
            </div>

            <div>
              <label className="block text-sm font-medium">Friend</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={friend}
                onChange={(e) => setFriend(e.target.value)}
              >
                {MOCK_FRIENDS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-2xl bg-white p-4 shadow mb-4">
          <h2 className="mb-2 text-lg font-medium">Preferences</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Meeting length (minutes)</label>
              <input
                type="number"
                min={1}
                step={1}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Time Zone</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
              >
                {TZ_OPTIONS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Window start (date)</label>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Window end (date)</label>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Work start (time)</label>
              <input
                type="time"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Work end (time)</label>
              <input
                type="time"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        <footer className="mt-6 text-center text-xs text-slate-500">
          Mock UI only — there are no API calls on this page.
        </footer>
      </div>
    </div>
  );
}
