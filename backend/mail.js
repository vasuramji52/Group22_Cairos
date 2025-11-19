// mail.js
const sgMail = require("@sendgrid/mail");

// --------------------------------------------------
// Load and validate environment variables
// --------------------------------------------------
if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY not set. Emails will not be sent.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM =
  process.env.SENDGRID_FROM_EMAIL ||
  process.env.SENDGRID_FROM ||
  null;

// --------------------------------------------------
// Generic mail sender (used by verify/reset + meetings)
// --------------------------------------------------
async function sendMail({ to, subject, text, html }) {
  if (!FROM) {
    console.error("❌ SENDGRID_FROM_EMAIL / SENDGRID_FROM not set in .env");
    return;
  }

  if (!process.env.SENDGRID_API_KEY) {
    console.error("❌ SENDGRID_API_KEY not set. Cannot send email.");
    return;
  }

  const msg = {
    to,
    from: FROM,
    subject,
    text,
    html,
  };

  try {
    const resp = await sgMail.send(msg);
    console.log(`✅ Sent email to ${to} | Subject: "${subject}"`);
    return resp;
  } catch (err) {
    console.error("❌ SendGrid error:", err.response?.body || err);
  }
}

// --------------------------------------------------
// Pretty Meeting Notification Email
// --------------------------------------------------
async function sendMeetingScheduledEmail({
  to,
  meetingTitle,
  hostName,
  guestName,
  startISO,
  endISO,
  tz,
}) {
  console.log("📧 sendMeetingScheduledEmail called with:", {
    to,
    meetingTitle,
    hostName,
    guestName,
    startISO,
    endISO,
    tz,
  });

  const startLocal = new Date(startISO).toLocaleString("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const endLocal = new Date(endISO).toLocaleString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  });

  const subject = `📅 ${meetingTitle} Scheduled`;

  const text = `
Hi ${guestName || ""},

A meeting "${meetingTitle}" has been scheduled with ${hostName || "someone"}.

Time: ${startLocal} – ${endLocal} (${tz})

You should also see this on your Google Calendar.

— Cairos
`.trim();

  // --------------------------------------------------
  // Beautiful HTML Email Template
  // --------------------------------------------------
  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <body style="
      margin:0;
      padding:0;
      background:#f4efe6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color:#1B4B5A;
    ">
      <table width="100%" style="background:#f4efe6;padding:24px 0;">
        <tr>
          <td align="center">
            <table width="100%" style="
              max-width:600px;
              background:#FAF4E6;
              border-radius:16px;
              border:1px solid #D4AF37;
              box-shadow:0 6px 18px rgba(0,0,0,0.06);
              overflow:hidden;
            ">
              
              <!-- Header -->
              <tr>
                <td style="
                  background:linear-gradient(135deg,#1B4B5A,#2C6E7E);
                  padding:20px;
                  color:#FDF7EA;
                ">
                  <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;">
                    Kairos Scheduling
                  </div>
                  <div style="font-size:20px;font-weight:600;margin-top:4px;">
                    New Meeting Scheduled
                  </div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:24px;">
                  <p style="font-size:15px;">Hi ${guestName || ""},</p>

                  <p style="font-size:15px;line-height:1.5;">
                    A meeting <strong>"${meetingTitle}"</strong> has been scheduled with
                    <strong>${hostName || "someone"}</strong>.
                  </p>

                  <!-- Meeting Details Card -->
                  <div style="
                    border:1px solid rgba(212,175,55,0.5);
                    border-radius:12px;
                    padding:16px;
                    background:#FFFDF7;
                    margin:20px 0;
                  ">
                    <div style="font-size:13px;text-transform:uppercase;color:#946923;margin-bottom:6px;">
                      Meeting Details
                    </div>

                    <div style="font-size:15px;font-weight:600;color:#1B4B5A;margin-bottom:4px;">
                      ${meetingTitle}
                    </div>

                    <div style="font-size:14px;color:#2C6E7E;margin-bottom:10px;">
                      With ${hostName}
                    </div>

                    <div style="font-size:14px;color:#1B4B5A;">
                      <strong>Time:</strong><br/>
                      ${startLocal} – ${endLocal} (${tz})
                    </div>
                  </div>

                  <!-- Button -->
                  <a href="https://calendar.google.com"
                    style="
                      display:inline-block;
                      padding:10px 20px;
                      background:#1B4B5A;
                      color:#F8EAD0;
                      border-radius:999px;
                      text-decoration:none;
                      border:1px solid #D4AF37;
                      font-size:14px;
                      font-weight:500;
                      margin-bottom:20px;
                    ">
                    Open Google Calendar
                  </a>

                  <p style="font-size:13px;color:#6A5C3A;">
                    You should also see this meeting on your Google Calendar.
                  </p>
                  <p style="font-size:13px;color:#6A5C3A;">
                    — Cairos
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="
                  padding:12px 24px;
                  font-size:11px;
                  color:#9b8b68;
                  background:#f6efe0;
                  border-top:1px solid rgba(212,175,55,0.4);
                ">
                  You received this email because someone scheduled a meeting with you in Cairos.
                  If you did not expect this, you can safely ignore this message.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  return sendMail({ to, subject, text, html });
}

// --------------------------------------------------
module.exports = {
  sendMail,
  sendMeetingScheduledEmail,
};
