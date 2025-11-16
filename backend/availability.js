// routes/availability.js
const { getGoogleAccessToken } = require('./google.tokens');
const {
  mergeIntervals,
  negateBusyAndFindFirstGap,
  fetchFreeBusy
} = require('./availability.util.js');
// const { requireAuth } = require('../lib/auth.middleware'); // ← optional

exports.setApp = function setApp(app, client) {
  const db = client.db('COP4331Cards');

  app.get('/api/availability/first', /* requireAuth, */ async (req, res) => {
    try {
      const {
        userA,
        userB,
        minutes,
        start,   //days you want to check
        end,
        tz = 'UTC',
        workStart,  //working hours within those days 
        workEnd
      } = req.query;

      if (!userA || !userB) {
        return res.status(400).json({ error: 'missing_user_ids' });
      }

      const timeMin = start ? new Date(start) : new Date();
      const timeMax = end
        ? new Date(end)
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      if (!(timeMin < timeMax)) {
        return res.status(400).json({ error: 'bad_time_window' });
      }

      const m = Number(minutes);
      if (!Number.isFinite(m) || m <= 0) {
        return res.status(400).json({ error: 'bad_minutes' });
      }

      const wStart = workStart != null ? Number(workStart) : null;
      const wEnd = workEnd != null ? Number(workEnd) : null;

      // 1) Access tokens (refresh if needed)
      const [tokA, tokB] = await Promise.all([
        getGoogleAccessToken(db, userA),
        getGoogleAccessToken(db, userB)
      ]);

      // 2) FreeBusy for both
      const [busyA, busyB] = await Promise.all([
        fetchFreeBusy(tokA, timeMin.toISOString(), timeMax.toISOString(), tz),
        fetchFreeBusy(tokB, timeMin.toISOString(), timeMax.toISOString(), tz)
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
        return res.status(200).json({ ok: false, error: 'no_slot' });
      }

      return res.status(200).json({
        ok: true,
        slot: {
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          tz
        }
      });
    } catch (e) {
      console.error('availability error:', e);
      return res.status(500).json({ error: e.message || String(e) });
    }
  });
};


