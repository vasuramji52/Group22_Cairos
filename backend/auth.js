const bcrypt = require('bcryptjs');
const jwtLib = require('./createJWT.js');
const { ObjectId } = require('mongodb');
const { sendMail } = require('./mail');
const { issueToken, consumeToken, validateToken  } = require('./tokenStore');

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
const BACKEND_BASE_URL  = process.env.BACKEND_BASE_URL  || 'http://localhost:5000/api';

exports.setApp = function (app, client) 
{
  const db = client.db('COP4331Cards');

  // health check
  app.get('/api/ping', (_req, res) => res.json({ ok: true }));

  //
  // REGISTER (now sends verify email)
  //
  app.post('/api/register', async (req, res) => 
  {
    try {
      const { firstName, lastName, email, password } = req.body;

      if (!firstName || !lastName || !email || !password)
        return res.status(400).json({ error: 'missing_fields' });

      const normalizedEmail = email.toLowerCase().trim();

      // does user already exist?
      const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
      if (existingUser)
        return res.status(409).json({ error: 'User already exists' });

      // hash pw
      const passwordHash = await bcrypt.hash(password, 10);

      // create user with isVerified: false
      const now = new Date();
      const newUser = {
        firstName,
        lastName,
        email: normalizedEmail,
        passwordHash,
        isVerified: false,
        google: { connected: false, accountId: null },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('users').insertOne(newUser);
      const userId = result.insertedId;

      // make a verification token that expires in 15 minutes
      const { raw: verifyToken } = await issueToken(db, { userId, type: 'verify', minutes: 15 });

      // build magic link that hits our verify route
      const link = `${BACKEND_BASE_URL}/verify-email-link?uid=${userId.toString()}&token=${verifyToken}`;

      // send email
      await sendMail({
        to: normalizedEmail,
        subject: 'Verify your email',
        html: `
          <p>Hi ${firstName},</p>
          <p>Thanks for signing up. Please verify your email to activate your account:</p>
          <p><a href="${link}">Click here to verify your email</a></p>
          <p>This link expires in 15 minutes.</p>
        `
      });

      // respond
      return res.status(200).json({
        ok: true,
        message: 'Registered. Check your email to verify.'
      });
    } 
    catch (e) 
    {
      console.error('Register error:', e);
      return res.status(500).json({ error: e.toString() });
    }
  });

  // VERIFY EMAIL LINK
  //
  app.get('/api/verify-email-link', async (req, res) => {
    try {
      const { uid, token } = req.query;

      if (!uid || !token) {
        return res.status(400).send('Missing uid or token');
      }

      // find user
      const user = await db.collection('users').findOne({ _id: new ObjectId(uid) });
      if (!user) return res.status(404).send('User not found');

      // already verified -> just bounce them to frontend with verified=1
      if (user.isVerified === true) {
        return res.redirect(`${FRONTEND_BASE_URL}/?verified=1`);
      }

      // check token
      const result = await consumeToken(db, {
        userId: uid,
        type: 'verify',
        raw: token
      });

      if (!result.ok) {
        return res.status(400).send('Verification failed or expired.');
      }

      // mark verified
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { isVerified: true, updatedAt: new Date() } }
      );

      // send them back to frontend
      return res.redirect(`${FRONTEND_BASE_URL}/?verified=1`);
    } catch (e) {
      console.error('Verify link error:', e);
      return res.status(500).send('Server error');
    }
  });

  //
  // LOGIN (mostly same, still blocks unverified)
  //
  app.post('/api/login', async (req, res) => 
  {
    console.log('Reached /api/login route');

    try {
      const { email, password } = req.body;      
      const normalizedEmail = String(email).toLowerCase().trim();

      if (!email || !password)
        return res.status(400).json({ error: 'missing_fields' });

      const user = await db.collection('users').findOne({ email: normalizedEmail });
      if (!user)
        return res.status(401).json({ error: 'Invalid email' });

      if (!user.isVerified)
        return res.status(401).json({ error: 'User email not verified' });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid)
        return res.status(401).json({ error: 'Invalid password' });

      // issue session JWT
      const token = jwtLib.createToken(user.firstName, user.lastName, user._id);

      return res.status(200).json(token); // { accessToken: '...' }
    } 
    catch (e) 
    {
      console.error('Login error:', e);
      return res.status(500).json({ error: e.toString() });
    }
  });

  app.post('/api/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'missing_email' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.collection('users').findOne({ email: normalizedEmail });

    // always respond 200 to avoid leaking existence
    if (!user) return res.status(200).json({ ok: true, message: 'If that email exists, a link was sent.' });

    // issue a 15-minute reset token
    const { raw: resetToken } = await issueToken(db, { userId: user._id, type: 'reset', minutes: 15 });

    const link = `${BACKEND_BASE_URL}/reset-password-link?uid=${user._id.toString()}&token=${resetToken}`;

    await sendMail({
      to: normalizedEmail,
      subject: 'Reset your password',
      html: `
        <p>Hi ${user.firstName},</p>
        <p>You requested to reset your password. Click below:</p>
        <p><a href="${link}">Reset your password</a></p>
        <p>This link expires in 15 minutes.</p>
      `
    });

    return res.status(200).json({ ok: true, message: 'If that email exists, a link was sent.' });
  } catch (e) {
    console.error('Request reset error:', e);
    return res.status(500).json({ error: e.toString() });
  }
});

app.get('/api/reset-password-link', async (req, res) => {
  try {
    const { uid, token } = req.query;
    if (!uid || !token) return res.status(400).send('Missing uid or token');


    const ok = await validateToken(db, { userId: uid, type: 'reset', raw: token });
    if (!ok.ok) return res.status(400).send('Reset link invalid or expired');

    // Send them to your frontend page to enter a new password
    return res.redirect(`${FRONTEND_BASE_URL}/reset-password?uid=${uid}&token=${token}`);
  } catch (e) {
    console.error('Reset link error:', e);
    return res.status(500).send('Server error');
  }
});

app.post('/api/confirm-reset-password', async (req, res) => {
  try {
    const { uid, token, newPassword } = req.body;
    if (!uid || !token || !newPassword)
      return res.status(400).json({ error: 'missing_fields' });

    // Basic policy – adjust as needed
    if (String(newPassword).length < 8)
      return res.status(400).json({ error: 'weak_password' });

    // Now consume to prevent reuse
    const result = await consumeToken(db, { userId: uid, type: 'reset', raw: token });
    if (!result.ok) return res.status(400).json({ error: 'invalid_or_expired_token' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.collection('users').updateOne(
      { _id: new ObjectId(uid) },
      { $set: { passwordHash, updatedAt: new Date() } }
    );

    return res.status(200).json({ ok: true, message: 'Password updated successfully.' });
  } catch (e) {
    console.error('Confirm reset error:', e);
    return res.status(500).json({ error: e.toString() });
  }
});

/*app.post('/api/dev-reset-link', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'missing_email' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.collection('users').findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    // issue a reset token for THIS user
    const { raw } = await issueToken(db, {
      userId: user._id,
      type: 'reset',
      minutes: 15
    });

    const link = `${BACKEND_BASE_URL}/reset-password-link?uid=${user._id.toString()}&token=${raw}`;

    return res.status(200).json({
      ok: true,
      uid: user._id.toString(),
      token: raw,
      link
    });
  } catch (e) {
    console.error('dev-reset-link error:', e);
    return res.status(500).json({ error: e.toString() });
  }
}); */


};

