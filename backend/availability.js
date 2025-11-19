// routes/availability.js
const { getGoogleAccessToken } = require("./google.tokens");
const {
  mergeIntervals,
  negateBusyAndFindFirstGap,
  fetchFreeBusy,
} = require("./availability.util.js");
const { ObjectId } = require("mongodb"); // 🔹 add this

exports.setApp = function setApp(app, client) {
  const db = client.db("COP4331Cards");


  app.get("/api/availability/first", /* requireAuth, */ async (req, res) => {
    try {
      const {
        userA,
        userB,
        minutes,
        start, // days you want to check
        end,
        tz = "UTC",
        workStart, // working hours within those days
        workEnd,
      } = req.query;

      if (!userA || !userB) {
        return res.status(400).json({ error: "missing_user_ids" });
      }

      const timeMin = start ? new Date(start) : new Date();
      const timeMax = end
        ? new Date(end)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      if (!(timeMin < timeMax)) {
        return res.status(400).json({ error: "bad_time_window" });
      }

      const m = Number(minutes);
      if (!Number.isFinite(m) || m <= 0) {
        return res.status(400).json({ error: "bad_minutes" });
      }

      const wStart = workStart != null ? Number(workStart) : null;
      const wEnd = workEnd != null ? Number(workEnd) : null;

      // 1) Access tokens (refresh if needed)
      const [tokA, tokB] = await Promise.all([
        getGoogleAccessToken(db, userA),
        getGoogleAccessToken(db, userB),
      ]);

      // 2) FreeBusy for both
      const [busyA, busyB] = await Promise.all([
        fetchFreeBusy(tokA, timeMin.toISOString(), timeMax.toISOString(), tz),
        fetchFreeBusy(tokB, timeMin.toISOString(), timeMax.toISOString(), tz),
      ]);

      // 3) Union busy intervals
      const busyUnion = mergeIntervals([...busyA, ...busyB]);

      // 4) Find first available slot
      const slot = negateBusyAndFindFirstGap(
        busyUnion,
        timeMin,
        timeMax,
        m,
        tz,
        wStart,
        wEnd
      );

      if (!slot) {
        return res.status(200).json({ ok: false, error: "no_slot" });
      }

      return res.status(200).json({
        ok: true,
        slot: {
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          tz,
        },
      });
    } catch (e) {
      console.error("availability error:", e);
      return res.status(500).json({ error: e.message || String(e) });
    }
  });

  app.post("/api/availability/book", async (req, res) => {
    try {
      const { userA, userB, start, end, tz = "UTC", summary, description } =
        req.body;

      if (!userA || !userB || !start || !end) {
        return res.status(400).json({ error: "missing_fields" });
      }

      // Look up emails for attendees
      const users = await db
        .collection("Users")
        .find({
          _id: {
            $in: [new ObjectId(userA), new ObjectId(userB)],
          },
        })
        .toArray();

      const attendees = users
        .filter((u) => u.email)
        .map((u) => ({ email: u.email }));

      const eventBody = {
        summary: summary || "Meeting",
        description: description || "Scheduled via Kairos",
        start: {
          dateTime: start,
          timeZone: tz,
        },
        end: {
          dateTime: end,
          timeZone: tz,
        },
        ...(attendees.length ? { attendees } : {}),
      };

      const userIds = [userA, userB];

      for (const uid of userIds) {
        const token = await getGoogleAccessToken(db, uid);

        if (!token) {
          return res.status(400).json({
            error: "no_google_token",
            userId: uid,
          });
        }

        // Node 18+ has global fetch; if not, use node-fetch like in availability.util.js
        const r = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventBody),
          }
        );

        if (!r.ok) {
          const text = await r.text();
          console.error("Google events.insert failed for user", uid, text);
          return res.status(502).json({
            error: "google_events_insert_failed",
            userId: uid,
            details: text,
          });
        }
      }

      return res.json({ ok: true });
    } catch (e) {
      console.error("availability book error:", e);
      return res.status(500).json({ error: e.message || String(e) });
    }
  });
};
