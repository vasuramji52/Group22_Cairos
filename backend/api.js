require("express");
require("mongodb");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
var token = require("./createJWT.js");

// --- Helpers ---
function makeRawToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex"); // send to user
}
function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex"); // store in DB
}

// Nodemailer transport (SendGrid or Gmail SMTP via .env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail(to, subject, html) {
  const from = process.env.SMTP_FROM || "no-reply@example.com";
  return transporter.sendMail({ from, to, subject, html });
}

exports.setApp = function (app, client) {
  // === REGISTER ===
  app.post("/auth/register", async (req, res) => {
    try {
      const DB_NAME = process.env.DB_NAME || "COP4331Cards";
      const db = client.db(DB_NAME);
      const { firstName, lastName, email, password } = req.body || {};

      // basic validation
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "missing_fields" });
      }

      const emailLc = String(email).trim().toLowerCase();

      // block duplicates
      const existing = await db.collection("users").findOne({ email: emailLc });
      if (existing) {
        return res.status(409).json({ error: "email_in_use" });
      }

      // create user (unverified)
      const now = new Date();
      const passwordHash = await bcrypt.hash(password, 10);
      const userDoc = {
        firstName,
        lastName,
        email: emailLc,
        passwordHash,
        isVerified: false,
        google: { connected: false },
        createdAt: now,
        updatedAt: now,
      };

      const { insertedId: userId } = await db.collection("users").insertOne(userDoc);

      // create VERIFY token (one active per user)
      await db.collection("tokens").deleteOne({ userId, type: "verify" });
      const rawToken = makeRawToken(32);
      const tokenHash = sha256(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.collection("tokens").insertOne({
        userId,
        type: "verify",
        tokenHash,
        expiresAt,
        usedAt: null,
        createdAt: now,
        updatedAt: now,
      });

      // === Build verification link ===
      const apiBase = process.env.API_BASE_URL || "http://localhost:5000";
      const verifyUrl = `${apiBase}/auth/verify-email?token=${rawToken}`;

      // === Send the actual verification email via SendGrid ===
      try {
        const html = `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;line-height:1.5">
            <h2 style="margin:0 0 12px">Verify your JointTime account</h2>
            <p>Click the button below to verify your email address.</p>
            <p>
              <a href="${verifyUrl}"
                 style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">
                Verify Email
              </a>
            </p>
            <p style="font-size:13px;color:#555">Or paste this link in your browser:</p>
            <p style="word-break:break-all;font-size:13px;color:#333">${verifyUrl}</p>
          </div>
        `;
        await sendEmail(emailLc, "Verify your JointTime account", html);
        console.log("📧 Verification email sent to", emailLc);
      } catch (e) {
        console.error("❌ sendEmail error:", e.message);
      }

      // === Return response ===
      return res.status(200).json({
        message: "verification_sent",
        verifyUrlDevOnly: verifyUrl, // optional debug link
      });
    } catch (err) {
      console.error("register error:", err);
      return res.status(500).json({ error: "server_error" });
    }
  });

  // === VERIFY EMAIL ===
  app.get("/auth/verify-email", async (req, res) => {
    try {
      const DB_NAME = process.env.DB_NAME || "COP4331Cards";
      const db = client.db(DB_NAME);
      const raw = String(req.query.token || "");
      if (!raw) return res.status(400).send("Invalid token");

      const tokenHash = sha256(raw);
      const tok = await db.collection("tokens").findOne({
        tokenHash,
        type: "verify",
        usedAt: null,
      });

      if (!tok) return res.status(400).send("Invalid or used token");
      if (tok.expiresAt && tok.expiresAt < new Date()) return res.status(400).send("Token expired");

      // Mark user verified
      await db.collection("users").updateOne(
        { _id: tok.userId },
        { $set: { isVerified: true, updatedAt: new Date() } }
      );

      // Mark token used
      await db.collection("tokens").updateOne(
        { _id: tok._id },
        { $set: { usedAt: new Date(), updatedAt: new Date() } }
      );

      const redirectPath = process.env.VERIFY_REDIRECT || "/login";
      const frontendBase = process.env.APP_BASE_URL || "http://localhost:5173";
      return res.redirect(`${frontendBase}${redirectPath}`);
    } catch (err) {
      console.error("verify-email error:", err);
      return res.status(500).send("Server error");
    }
  });
};



// exports.setApp = function (app, client) {
//   // /api/addcard
//   app.post("/api/addcard", async (req, res) => {
//     const { userId, card, jwtToken } = req.body;
//     let error = "";

//     try {
//       if (token.isExpired(jwtToken)) {
//         return res
//           .status(200)
//           .json({ error: "The JWT is no longer valid", jwtToken: "" });
//       }
//     } catch (e) {
//       console.log("isExpired check error:", e.message);
//     }

//     try {
//       const db = client.db("COP4331Cards");
//       await db.collection("Cards").insertOne({ Card: card, UserId: userId });
//     } catch (e) {
//       error = e.toString();
//     }

//     let refreshedStr = "";
//     try {
//       const refreshedToken = token.refresh(jwtToken); // { accessToken: '...' }
//       refreshedStr = refreshedToken?.accessToken ?? "";
//     } catch (e) {
//       console.log("refresh error:", e.message);
//     }

//     return res
//       .status(200)
//       .json({ error, jwtToken: refreshedStr, accessToken: refreshedStr });
//   });

//   app.post("/api/login", async (req, res) => {
//     const { login, password } = req.body;

//     const db = client.db("COP4331Cards");
//     const results = await db
//       .collection("Users")
//       .find({ Login: login, Password: password })
//       .toArray();

//     if (results.length > 0) {
//       const id = results[0].UserID ?? results[0].UserId; // handles both
//       const fn = results[0].FirstName;
//       const ln = results[0].LastName;

//       try {
//         const t = token.createToken(fn, ln, id); // -> { accessToken: 'eyJ...' }
//         return res.status(200).json({
//           id,
//           firstName: fn,
//           lastName: ln,
//           jwtToken: t.accessToken, // <-- IMPORTANT (string)
//           accessToken: t.accessToken, // optional: keeps old code happy
//           error: "",
//         });
//       } catch (e) {
//         return res.status(200).json({
//           id: -1,
//           firstName: "",
//           lastName: "",
//           jwtToken: "",
//           accessToken: "",
//           error: e.message,
//         });
//       }
//     } else {
//       return res.status(200).json({
//         id: -1,
//         firstName: "",
//         lastName: "",
//         jwtToken: "",
//         accessToken: "",
//         error: "Login/Password incorrect",
//       });
//     }
//   });

//   // /api/searchcards
//   app.post("/api/searchcards", async (req, res) => {
//     const { userId, search, jwtToken } = req.body;
//     let error = "";

//     try {
//       if (token.isExpired(jwtToken)) {
//         return res
//           .status(200)
//           .json({ error: "The JWT is no longer valid", jwtToken: "" });
//       }
//     } catch (e) {
//       console.log("isExpired check error:", e.message);
//     }

//     const _search = (search || "").trim();

//     const db = client.db("COP4331Cards");
//     const results = await db
//       .collection("Cards")
//       .find({ Card: { $regex: _search + ".*", $options: "i" } })
//       .toArray();

//     const _ret = results.map((r) => r.Card);

//     let refreshedStr = "";
//     try {
//       const refreshedToken = token.refresh(jwtToken); // { accessToken: '...' }
//       refreshedStr = refreshedToken?.accessToken ?? "";
//     } catch (e) {
//       console.log("refresh error:", e.message);
//     }

//     return res
//       .status(200)
//       .json({
//         results: _ret,
//         error,
//         jwtToken: refreshedStr,
//         accessToken: refreshedStr,
//       });
//   });
// };
