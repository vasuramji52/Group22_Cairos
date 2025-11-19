// routes/availability.js
const { getGoogleAccessToken } = require("./google.tokens");
const {
  mergeIntervals,
  negateBusyAndFindFirstGap,
  fetchFreeBusy,
} = require("./availability.util.js");
const { ObjectId } = require("mongodb");
const { sendMeetingScheduledEmail } = require("./mail"); // <-- SendGrid helper

exports.setApp = function setApp(app, client) {
  const db = client.db("COP4331Cards");

  // ------------------------------------------------------------
  // GET /api/availability/first
  // ------------------------------------------------------------
  app.get("/api/availability/first", async (req, res) => {
    try {
      const {
        userA,
        userB,
        minutes,
        start,
        end,
        tz = "UTC",
        workStart,
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

      const wStart = workStart ? Number(workStart) : null;
      const wEnd = workEnd ? Number(workEnd) : null;

      // 1) Access tokens for both users
      const [tokA, tokB] = await Promise.all([
        getGoogleAccessToken(db, userA),
        getGoogleAccessToken(db, userB),
      ]);

      // 2) Fetch free/busy for both
      const [busyA, busyB] = await Promise.all([
        fetchFreeBusy(tokA, timeMin.toISOString(), timeMax.toISOString(), tz),
        fetchFreeBusy(tokB, timeMin.toISOString(), timeMax.toISOString(), tz),
      ]);

      // 3) Merge busy schedules
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

  // ------------------------------------------------------------
  // POST /api/availability/book
  // Creates Google Calendar events + sends email notifications
  // ------------------------------------------------------------
  function fullName(u) {
    const first = (u.firstName || "").trim();
    const last = (u.lastName || "").trim();
    const both = `${first} ${last}`.trim();
    return both || u.email || "someone";
  }

   app.post("/api/availability/book", async (req, res) => {
    try {
      const { userA, userB, start, end, tz = "UTC", summary, description } =
        req.body;

      if (!userA || !userB || !start || !end) {
        return res.status(400).json({ error: "missing_fields" });
      }

      // Look up users from the same collection as /me
      const users = await db
        .collection("users") // lowercase, like /api/me
        .find({
          _id: {
            $in: [new ObjectId(userA), new ObjectId(userB)],
          },
        })
        .project({ firstName: 1, lastName: 1, email: 1 })
        .toArray();

      // We only use emails for custom SendGrid emails now
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
        // ❌ NO attendees here → no Google invites / no auto-adding to other calendars
      };

      const userIds = [userA, userB];

      // 🔒 BOOKING LOGIC — loop + fetch unchanged, just uses eventBody above
      for (const uid of userIds) {
        const token = await getGoogleAccessToken(db, uid);

        if (!token) {
          return res.status(400).json({
            error: "no_google_token",
            userId: uid,
          });
        }

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
      // 🔒 END BOOKING LOGIC

      // 📧 Custom SendGrid emails (purely our side, no Google invites)
      try {
        if (users.length) {
          const byId = new Map(users.map((u) => [u._id.toString(), u]));
          const meetingTitle = summary || "Meeting";

          for (const uid of userIds) {
            const userDoc = byId.get(uid?.toString());
            if (!userDoc || !userDoc.email) continue;

            // "Host" is the other person for the email copy
            const otherId = uid === userA ? userB : userA;
            const otherDoc = byId.get(otherId?.toString());

            const guestName = fullName(userDoc);
            const hostName = otherDoc ? fullName(otherDoc) : "someone";

            await sendMeetingScheduledEmail({
              to: userDoc.email,
              meetingTitle,
              hostName,
              guestName,
              startISO: start,
              endISO: end,
              tz,
            });
          }
        } else {
          console.warn(
            "[/api/availability/book] No users found for emails, skipping SendGrid"
          );
        }
      } catch (err) {
        console.error("sendMeetingScheduledEmail failed:", err);
        // don't affect the booking outcome
      }

      return res.json({ ok: true });
    } catch (e) {
      console.error("availability book error:", e);
      return res.status(500).json({ error: e.message || String(e) });
    }
  });
};
