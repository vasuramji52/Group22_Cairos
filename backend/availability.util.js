// backend/availability.util.js
// If Node < 18, install node-fetch and uncomment the next line:
// const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

/** Call Google Calendar FreeBusy for the primary calendar. */
async function fetchFreeBusy(accessToken, timeMinISO, timeMaxISO, tz = 'UTC') {
  const r = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      timeZone: tz,
      items: [{ id: 'primary' }],
    }),
  });
  if (!r.ok) throw new Error(`freeBusy failed: ${await r.text()}`);

  const data = await r.json();
  const busy = data.calendars?.primary?.busy ?? [];
  return busy.map(({ start, end }) => ({ start: new Date(start), end: new Date(end) }));
}

/** Merge overlapping intervals of form { start: Date, end: Date }. */
function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = intervals.slice().sort((a, b) => a.start - b.start);
  const out = [];
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const e = sorted[i];
    if (e.start <= cur.end) {
      if (e.end > cur.end) cur.end = e.end;
    } else {
      out.push(cur);
      cur = { ...e };
    }
  }
  out.push(cur);
  return out;
}

/**
 * Find the first free gap ≥ minutes between windowStart and windowEnd.
 * Optional work hours [workStartHour, workEndHour] (0–23).
 */
function negateBusyAndFindFirstGap(busyUnion, windowStart, windowEnd, minutes, tz, workStartHour = null, workEndHour = null) {
  const need = minutes * 60 * 1000;

  function clampToWork(s, e) {
    if (workStartHour == null || workEndHour == null) return [{ start: s, end: e }];
    const segs = [];
    let d = new Date(s);
    while (d < e) {
      const dayStart = new Date(d); dayStart.setHours(workStartHour, 0, 0, 0);
      const dayEnd   = new Date(d); dayEnd.setHours(workEndHour,   0, 0, 0);
      const segStart = new Date(Math.max(s, dayStart));
      const segEnd   = new Date(Math.min(e, dayEnd));
      if (segStart < segEnd) segs.push({ start: segStart, end: segEnd });
      d = new Date(dayStart.getTime() + 24 * 3600 * 1000);
    }
    return segs;
  }

  let cursor = new Date(windowStart);

  for (const b of busyUnion) {
    if (b.end <= windowStart) continue;
    if (b.start >= windowEnd) break;

    const freeStart = cursor;
    const freeEnd = new Date(Math.min(b.start, windowEnd));
    if (freeStart < freeEnd) {
      for (const seg of clampToWork(freeStart, freeEnd)) {
        if (seg.end - seg.start >= need) {
          return { start: seg.start, end: new Date(seg.start.getTime() + need) };
        }
      }
    }

    if (b.end > cursor) cursor = new Date(b.end);
    if (cursor >= windowEnd) break;
  }

  if (cursor < windowEnd) {
    for (const seg of clampToWork(cursor, windowEnd)) {
      if (seg.end - seg.start >= need) {
        return { start: seg.start, end: new Date(seg.start.getTime() + need) };
      }
    }
  }

  return null;
}

module.exports = { fetchFreeBusy, mergeIntervals, negateBusyAndFindFirstGap };
