import { useState, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { EgyptianBorder, PapyrusCard, AnkhIcon } from "./egyptian-decorations";
import { getMeReal } from "../lib/api";
import { buildPath } from '../path';

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  google: { connected: boolean; accountId: string | null };
  createdAt: string; updatedAt: string;
};

export function ProfileSettings() {
  //const [user, setUser] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user_data");
    return stored ? JSON.parse(stored) : null;
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
  try {
    const data = await getMeReal();
    setUser(data);
  } catch (err) {
    console.error("Failed to load user:", err);
  }
}

function doLogout(event: any): void {
  event.preventDefault();
  // Clear all session data
  localStorage.removeItem("token_data");
  localStorage.removeItem('user_data');
  window.location.href = '/';
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-10 h-10 text-[#D4AF37]" />
            <div>
              <h1 className="text-[#D4AF37] tracking-wide">Profile & Settings</h1>
              <p className="text-[#C5A572]">Manage your account preferences</p>
            </div>
          </div>
          <EgyptianBorder className="my-4" />
        </div>

        {/* Connected Accounts */}
        <PapyrusCard className="mb-6">
          <CardHeader>
            <CardTitle className="text-[#1B4B5A]">Connected Accounts</CardTitle>
            <CardDescription className="text-[#2C6E7E]">
              Manage your connected calendar services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#D4AF37]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                  G
                </div>
                <div>
                  <p className="text-[#1B4B5A]">Google Calendar</p>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full ${
                  user?.google.connected
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-[#F4D0C1] text-[#C1440E]"
                }`}
              >
                {user?.google.connected ? "Connected" : "Not Connected"}
              </div>
            </div>
          </CardContent>
        </PapyrusCard>

        {/* Account Actions */}
        <PapyrusCard className="mb-6">
          <CardHeader>
            <CardTitle className="text-[#1B4B5A]">Account Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(true)}
              className="w-full justify-start border-[#C5A572] text-[#2C6E7E] hover:bg-[#F5E6D3]"
            >
              Change Password
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(true)}
              className="w-full justify-start border-[#C1440E] text-[#C1440E] hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </PapyrusCard>

        {/* App Info */}
        <div className="text-center space-y-2">
          <AnkhIcon className="w-8 h-8 mx-auto text-[#D4AF37]" />
          <p className="text-[#C5A572]">Cairos - Find Your Perfect Moment</p>
          <p className="text-[#C5A572]">Version 1.1.6</p>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-[#F5E6D3] border-2 border-[#D4AF37]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1B4B5A]">Logout?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#2C6E7E]">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-[#C5A572] text-[#C1440E]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={doLogout}
              className="bg-[#C1440E] hover:bg-[#C1440E]/90 text-white"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change / Forgot Password Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent className="bg-[#F5E6D3] border-2 border-[#D4AF37] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1B4B5A]">Reset your password</AlertDialogTitle>
            <AlertDialogDescription className="text-[#2C6E7E]">
              Enter your email address, and we’ll send you a password reset link.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ForgotPasswordInline onDone={() => setShowPasswordDialog(false)} />

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-[#C5A572] text-[#C1440E]">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ForgotPasswordInline({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(buildPath('api/request-password-reset'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("Error requesting reset. Please try again.");
        return;
      }
      setStatus(data.message || "If that email exists, a link was sent.");
      setTimeout(onDone, 3000);
    } catch (err) {
      console.error("Reset request failed", err);
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label htmlFor="reset-email" className="block text-[#1B4B5A] text-sm mb-1">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@gmail.com"
          className="w-full px-3 py-2 rounded-md border border-[#2C6E7E] bg-white text-[#1B4B5A] placeholder:text-[#1B4B5A]/50 focus:border-[#1B4B5A] outline-none"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#2C6E7E] hover:bg-[#1B4B5A] text-[#FFD700]"
      >
        {loading ? "Sending..." : "Send reset link"}
      </Button>
      {status && <p className="text-sm text-center text-[#1B4B5A]/80">{status}</p>}
    </form>
  );
}
