// mail.js
const sgMail = require('@sendgrid/mail');

if (!process.env.SENDGRID_API_KEY) {
  console.warn('⚠️ SENDGRID_API_KEY not set. Emails will not be sent.');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const FROM = process.env.SENDGRID_FROM;

async function sendMail({ to, subject, html }) {
  if (!FROM) throw new Error('SENDGRID_FROM not set in .env');

  const msg = {
    to,
    from: FROM,
    subject,
    html
  };

  const resp = await sgMail.send(msg);
  console.log(`✅ Sent email to ${to}`);
  return resp;
}

module.exports = { sendMail };
