import React, { useState } from "react";
import { buildPath } from "./path";
import { storeToken } from "../tokenStorage";
import { jwtDecode } from "jwt-decode";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import './ui/Login.css';
import './ui/index.css';

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

    <div className="relative z-10">
      <div className="mb-6 text-center">
        <h2 className="text-[#1B4B5A] text-2xl mb-2">Welcome Back</h2>
        <p className="text-[#1B4B5A]/70">Log in to seize your kairos</p>
      </div>

      {/* Core login form */}
      <form onSubmit={doLogin} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="loginName" className="text-[#1B4B5A]">
            Email
          </Label>
          <Input
            id="loginName"
            type="text"
            placeholder="cleopatra@cairos.com"
            value={loginName}
            onChange={handleSetLoginName}
            className="bg-white/80 border-[1.5px] border-[#2C6E7E] focus:border-[#1B4B5A] text-[#1B4B5A] placeholder:text-[#1B4B5A]/40"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="loginPassword" className="text-[#1B4B5A]">
            Password
          </Label>
          <Input
            id="loginPassword"
            type="password"
            placeholder="Enter your password"
            value={loginPassword}
            onChange={handleSetPassword}
            className="bg-white/80 border-[1.5px] border-[#2C6E7E] focus:border-[#1B4B5A] text-[#1B4B5A] placeholder:text-[#1B4B5A]/40"
            required
          />
        </div>

          {/* Forgot Password */}
          {!showReset && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm text-[#1B4B5A]/80 hover:text-[#1B4B5A] underline"
                onClick={() => {
                  setShowReset(true);
                  setResetStatus("");
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

        <Button type="submit" className="w-full bg-[#2C6E7E] hover:bg-[#1B4B5A] text-[#FFD700]">
          Log In
        </Button>
        <span className="block text-center text-[#1B4B5A]/80 text-sm">{message}</span>
      </form>

      <div className="mt-6 pt-6 border-t border-[#C5A572]/30 text-center">
        <p className="text-sm text-[#1B4B5A]/80">
          Don't have an account?{' '}
          <button className="text-[#2C6E7E] hover:text-[#1B4B5A] underline">
            Sign up
          </button>
        </p>
      </div>

      {/* Reset Password Modal */}
      {showReset && (
        <div className="mt-6 p-4 border border-[#C5A572]/40 rounded-lg bg-white/70">
          <h3 className="text-[#1B4B5A] font-semibold mb-2">Reset Password</h3>
          <p className="text-[#1B4B5A]/70 text-sm mb-2">
            Enter your email. We’ll send a reset link if your account exists.
          </p>
          <Input
            type="email"
            placeholder="you@email.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className="bg-white/80 border-[1.5px] border-[#2C6E7E] focus:border-[#1B4B5A] text-[#1B4B5A] mb-2"
          />
          <Button onClick={handleRequestReset} className="w-full bg-[#2C6E7E] hover:bg-[#1B4B5A] text-[#FFD700] mb-2">
            Send reset link
          </Button>
          <p className="text-sm text-[#1B4B5A]/80">{resetStatus}</p>
          <button
            type="button"
            className="text-xs text-[#1B4B5A]/70 underline mt-2"
            onClick={() => setShowReset(false)}
          >
            Back to login
          </button>
        </div>
      )}
     </div>
  );
}

export default Login;
