import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setPassword] = useState("");

  const navigate = useNavigate();

  async function doLogin(event: any): Promise<void> {
    event.preventDefault();

    const obj = { email: loginName, password: loginPassword };
    const js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath("api/login"), {
        method: "POST",
        body: js,
        headers: { "Content-Type": "application/json" },
      });

      const res = await response.json();
      if (!response.ok || !res.accessToken) {
        console.error("Login failed:", res.error);
        setMessage(res.error || "User/Password combination incorrect");
        return;
      }

      const token = res.accessToken;
      storeToken(token);

      const decoded = jwtDecode<DecodedToken>(token);

      try {
        var ud = decoded;
        var userId = ud.iat;
        const firstName = ud.firstName;
        const lastName = ud.lastName;

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
        <div className="flex items-center justify-end">
          <button
            type="button"
            className="text-sm text-[#1B4B5A]/80 hover:text-[#1B4B5A] underline"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" className="w-full bg-[#2C6E7E] hover:bg-[#1B4B5A] text-[#FFD700]">
          Log In
        </Button>
        <span className="block text-center text-[#1B4B5A]/80 text-sm">{message}</span>
      </form>

      <div
        className="mt-6 pt-6 text-center"
        style={{
          borderTop: "1px solid hsla(42, 63%, 27%, 0.60)",
        }}
      >
        <p className="text-sm text-[#1B4B5A]/80">
          Don't have an account?{' '}
          <button
            type="button"
            className="text-[#2C6E7E] hover:text-[#1B4B5A] underline"
            onClick={() => navigate('/register')}
          >
            Sign up
          </button>
        </p>
      </div>
     </div>
  );
}

export default Login;
