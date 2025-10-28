const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

function ResetPassword() {
  const [params] = useSearchParams();
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/confirm-reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uid,
          token,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus("Password updated! You can log in now.");
      } else {
        setStatus(data.error || "Reset failed or link expired.");
      }
    } catch (err: any) {
        setStatus("Network error.");
    } finally {
      setLoading(false);
    }
  }

  // Edge case: no uid/token in URL
  if (!uid || !token) {
    return (
      <div style={{ maxWidth: 400, margin: "4rem auto", fontFamily: "sans-serif" }}>
        <h2>Invalid link</h2>
        <p>This password reset link is missing required data.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h2>Reset your password</h2>
      <p>Enter a new password below.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          style={{
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem"
          }}
          required
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#111827",
            color: "white",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
            cursor: "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Saving..." : "Update Password"}
        </button>
      </form>

      {status && (
        <p style={{ marginTop: "1rem", fontSize: ".9rem" }}>
          {status}
        </p>
      )}
    </div>
  );
}

export default ResetPassword;
