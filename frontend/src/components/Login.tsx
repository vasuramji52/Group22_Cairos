import React, { useState } from "react";
import { buildPath } from "./path";
import { storeToken } from "../tokenStorage";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  iat: number; // issued at
  firstName: string;
  lastName: string;
  [key: string]: any; // optional, in case there are other fields
}

function Login() {
  const [message, setMessage] = useState("");
  const [loginName, setLoginName] = React.useState("");
  const [loginPassword, setPassword] = React.useState("");

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState("");

  async function doLogin(event: any): Promise<void> {
    event.preventDefault();

    var obj = { email: loginName, password: loginPassword };
    var js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath("api/login"), {
        method: "POST",
        body: js,
        headers: { "Content-Type": "application/json" },
      });

      const res = await response.json();
      if (!response.ok) {
        console.error("Login failed:", res.error);
      }

      const token = res.accessToken;
      storeToken(token);

      const decoded = jwtDecode<DecodedToken>(token);

      try {
        var ud = decoded;
        var userId = ud.iat;
        var firstName = ud.firstName;
        var lastName = ud.lastName;

        if (userId <= 0) {
          setMessage("User/Password combination incorrect");
        } else {
          var user = { firstName: firstName, lastName: lastName, id: userId };
          localStorage.setItem("user_data", JSON.stringify(user));

          setMessage("");
          window.location.href = "/cards";
        }
      } catch (e) {
        console.log(e);
        return;
      }
    } catch (error: any) {
      alert(error.toString());
      return;
    }
  }

  function handleSetLoginName(e: any): void {
    setLoginName(e.target.value);
  }

  function handleSetPassword(e: any): void {
    setPassword(e.target.value);
  }

  async function handleRequestReset(e: any) {
    e.preventDefault();
    setResetStatus("Sending...");

    try {
      const resp = await fetch(buildPath("api/request-password-reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setResetStatus("Error requesting reset.");
      } else {
        // backend sends generic message
        setResetStatus(
          data.message || "If that email exists, a link was sent."
        );
      }
    } catch (err) {
      console.error("reset request failed", err);
      setResetStatus("Network error.");
    }
  }

  return (
    <div id="loginDiv">
      <span id="inner-title">PLEASE LOG IN</span>
      <br />
      Login:{" "}
      <input
        type="text"
        id="loginName"
        placeholder="Username"
        onChange={handleSetLoginName}
      />
      <br />
      Password:{" "}
      <input
        type="password"
        id="loginPassword"
        placeholder="Password"
        onChange={handleSetPassword}
      />
      <input
        type="submit"
        id="loginButton"
        className="buttons"
        value="Do It"
        onClick={doLogin}
      />
      <span id="loginResult">{message}</span>

      {/* Forgot password link */}
      {!showReset && (
        <button
          type="button"
          onClick={() => {
            setShowReset(true);
            setResetStatus("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#1e40af",
            textDecoration: "underline",
            fontSize: "0.9rem",
            cursor: "pointer",
            padding: 0,
            marginTop: "0.75rem",
            display: "block",
          }}
        >
          Forgot password?
        </button>
      )}

      {/* Reset password box */}
      {showReset && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            maxWidth: "300px",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
            Reset Password
          </div>

          <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
            Enter your email. We’ll send a reset link if your account exists.
          </div>

          <input
            type="email"
            placeholder="you@email.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            style={{
              width: "100%",
              marginBottom: "0.5rem",
              padding: "0.4rem",
              borderRadius: "4px",
              border: "1px solid #aaa",
            }}
          />

          <button
            onClick={handleRequestReset} // ✅ wire it up
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#0f172a",
              color: "white",
              fontWeight: 500,
              cursor: "pointer",
              marginBottom: "0.5rem",
            }}
          >
            Send reset link
          </button>

          <div
            style={{
              fontSize: "0.8rem",
              minHeight: "1rem",
              color: "#111827",
              wordBreak: "break-word",
            }}
          >
            {resetStatus}
          </div>

          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "#555",
              fontSize: "0.8rem",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
              marginTop: "0.5rem",
            }}
            onClick={() => {
              setShowReset(false);
            }}
          >
            Back to login
          </button>
        </div>
      )}
    </div>
  );
}

export default Login;
