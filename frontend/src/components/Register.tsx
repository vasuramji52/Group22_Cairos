import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { buildPath } from "./path";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const Register = () => {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch(buildPath("api/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        if (response.status === 409) {
          setStatus("An account with that email already exists.");
        } else if (data?.error === "weak_password") {
          setStatus("Password must be at least 8 characters long.");
        } else if (data?.error === "missing_fields") {
          setStatus("Please complete all fields.");
        } else {
          setStatus("Registration failed. Please try again.");
        }
        return;
      }

      setStatus("Success! Check your email to verify your account.");
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      console.error("Registration failed", err);
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative z-10">
      <div className="mb-6 text-center">
        <h2 className="text-[#1B4B5A] text-2xl mb-2">Create Account</h2>
        <p className="text-[#1B4B5A]/70">
          Join CAIROS and capture every opportunity
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-[#1B4B5A]">
            First Name
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Cleopatra"
            className="bg-white/80 border-[1.5px] border-[#2C6E7E] focus:border-[#1B4B5A] text-[#1B4B5A] placeholder:text-[#1B4B5A]/40"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-[#1B4B5A]">
            Last Name
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Philopator"
            className="bg-white/80 border-[1.5px] border-[#2C6E7E] focus:border-[#1B4B5A] text-[#1B4B5A] placeholder:text-[#1B4B5A]/40"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#1B4B5A]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cleopatra@cairos.com"
            className="bg-white/80 border-[1.5px] border-[#2C6E7E] focus:border-[#1B4B5A] text-[#1B4B5A] placeholder:text-[#1B4B5A]/40"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#1B4B5A]">
            Password
          </Label>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="
        bg-white/80 
        border-[1.5px] 
        border-[#2C6E7E] 
        focus:border-[#1B4B5A] 
        text-[#1B4B5A] 
        placeholder:text-[#1B4B5A]/40
        pr-12                    /* space for eye */
      "
              minLength={8}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="
        absolute 
        right-4 
        top-1/2 
        -translate-y-1/2 
        flex 
        items-center 
        text-[#1B4B5A]
        hover:text-[#0D3441]
        transition
      "
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#2C6E7E] hover:bg-[#1B4B5A] text-[#FFD700]"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </Button>

        {status && (
          <p className="text-center text-sm text-[#1B4B5A]/80">{status}</p>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-[#C5A572]/30 text-center">
        <p className="text-sm text-[#1B4B5A]/80">
          Already have an account?{" "}
          <button
            type="button"
            className="text-[#2C6E7E] hover:text-[#1B4B5A] underline"
            onClick={() => navigate("/")}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
