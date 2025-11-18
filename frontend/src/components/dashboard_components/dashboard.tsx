import { useEffect, useState } from "react";
import { Calendar, Users, Clock, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  EgyptianBorder,
  PapyrusCard,
  SundialIcon,
  NileWave,
} from "./egyptian-decorations";
import { ImageWithFallback } from "./ImageWithFallback";
import { api, getMeReal } from "../lib/api";
import {
  getScheduleTaskComplete,
  ONBOARDING_PROGRESS_EVENT,
} from "../lib/getting-started";

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  google: { connected: boolean; accountId: string | null };
  friends?: string[];
  createdAt: string;
  updatedAt: string;
};

interface DashboardProps {
  onNavigate: (view: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [hasScheduledMeeting, setHasScheduledMeeting] = useState(() =>
    getScheduleTaskComplete()
  );

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    // If we came back from Google with ?google=connected, refresh user from /api/me
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      // remove the query param from the URL (no reload)
      window.history.replaceState({}, document.title, window.location.pathname);
      loadUser(); // this will fetch /api/me and set user (google.connected = true)
    }
  }, []);

  // Old mock function to call the me endpoint
  // async function loadUser() {
  //   try {
  //     const userData = await getMe();
  //     setUser(userData);
  //   } catch (error) {
  //     console.error("Failed to load user:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  async function loadUser() {
    try {
      const u = await getMeReal(); // calls /api/me with token from localStorage
      setUser(u);
      // (optional) persist if you like:
      localStorage.setItem("user_data", JSON.stringify(u));
    } catch (err) {
      console.error("Failed to load user:", err);
    } finally {
      setLoading(false);
    }
  }

  // Old mock function to complete Google OAuth
  // async function handleConnectGoogle() {
  //   setConnecting(true);
  //   try {
  //     // Simulate OAuth flow
  //     await completeGoogleConnection();
  //     await loadUser();
  //   } catch (error) {
  //     console.error("Failed to connect Google Calendar:", error);
  //   } finally {
  //     setConnecting(false);
  //   }
  // }

  async function handleConnectGoogle() {
    setConnecting(true);
    try {
      // Must be authenticated; api() will add Authorization header from localStorage
      const res = await api("/api/oauth/google/init");
      const data = await res.json(); // { url: "https://accounts.google.com/o/oauth2/v2/auth?..." }

      if (!data?.url) throw new Error("No auth URL from init");

      // Send the user to Google’s consent screen
      window.location.href = data.url;
    } catch (error) {
      console.error("Failed to start Google OAuth:", error);
      setConnecting(false); // stay on page if something failed
    }
  }

  const userId = user?._id ?? null;

  useEffect(() => {
    setHasScheduledMeeting(getScheduleTaskComplete(userId));
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const handler: EventListener = () => {
      setHasScheduledMeeting(getScheduleTaskComplete(userId));
    };

    window.addEventListener(ONBOARDING_PROGRESS_EVENT, handler);
    return () => {
      window.removeEventListener(ONBOARDING_PROGRESS_EVENT, handler);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E]">
        <div className="text-[#D4AF37]">Loading...</div>
      </div>
    );
  }

  const friendCount = Array.isArray(user?.friends) ? user.friends.length : 0;
  const hasFriends = friendCount > 0;
  const calendarConnected = Boolean(user?.google.connected);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <SundialIcon className="w-10 h-10 text-[#D4AF37]" />
            <div>
              <h1 className="text-[#D4AF37] tracking-wide">
                Welcome back, {user?.firstName}
              </h1>
              <p className="text-[#C5A572]">
                Find the perfect moment to connect
              </p>
            </div>
          </div>
          <EgyptianBorder className="my-4" />
        </div>

        {/* Hero Section with Nile Background */}
        <div className="relative mb-8 rounded-xl overflow-hidden">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1662552445969-78212cc5899f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWxlJTIwcml2ZXIlMjBzdW5zZXR8ZW58MXx8fHwxNzYxNTk5NzgzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Nile sunset"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B4B5A]/90 to-transparent flex items-center px-8">
            <div>
              <h2 className="text-[#D4AF37] mb-2">Seize Your Kairos</h2>
              <p className="text-[#F5E6D3] max-w-md">
                Like the ancient Egyptians tracked time by the sun, discover the
                perfect moments to meet with your companions.
              </p>
            </div>
          </div>
        </div>

        {/* Google Calendar Connection Status */}
        <PapyrusCard className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1B4B5A]">
              <Calendar className="w-5 h-5" />
              Google Calendar Connection
            </CardTitle>
            <CardDescription className="text-[#2C6E7E]">
              {user?.google.connected
                ? "Your calendar is connected and synchronized"
                : "Connect your calendar to start finding the perfect meeting times"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.google.connected ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-900">Connected successfully</span>
              </div>
            ) : (
              <Button
                onClick={handleConnectGoogle}
                disabled={connecting}
                className="bg-[#1B4B5A] hover:bg-[#2C6E7E] text-[#D4AF37] border-2 border-[#D4AF37]"
              >
                {connecting ? "Connecting..." : "Connect Google Calendar"}
              </Button>
            )}
          </CardContent>
        </PapyrusCard>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Friends Card */}
          <PapyrusCard
            className="cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => onNavigate("/cards/friends")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1B4B5A]">
                <Users className="w-5 h-5 text-[#C1440E]" />
                Your Circle
              </CardTitle>
              <CardDescription className="text-[#2C6E7E]">
                Manage your connections and companions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-[#1B4B5A]">View and manage friends</p>
                <div className="text-[#D4AF37]">→</div>
              </div>
            </CardContent>
          </PapyrusCard>

          {/* Schedule Card */}
          <PapyrusCard
            className={`${
              user?.google.connected
                ? "cursor-pointer hover:shadow-xl transition-shadow"
                : "opacity-60 cursor-not-allowed"
            }`}
            onClick={() => user?.google.connected && onNavigate("/cards/schedule")}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#1B4B5A]">
                <Clock className="w-5 h-5 text-[#C1440E]" />
                Find Time
              </CardTitle>
              <CardDescription className="text-[#2C6E7E]">
                Combine schedules and discover perfect meeting times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-[#1B4B5A]">
                  {calendarConnected
                    ? "Start scheduling meetings"
                    : "Connect calendar first"}
                </p>
                <div className="text-[#D4AF37]">→</div>
              </div>
            </CardContent>
          </PapyrusCard>
        </div>

        {/* Decorative Wave */}
        <div className="text-[#D4AF37] opacity-20">
          <NileWave />
        </div>

        {/* Recent Activity / Tips */}
        <PapyrusCard className="mt-6">
          <CardHeader>
            <CardTitle className="text-[#1B4B5A]">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-[#2C6E7E]">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#1B4B5A] text-sm flex-shrink-0">
                  {calendarConnected ? "✓" : "1"}
                </div>
                <p>
                  {calendarConnected
                    ? "Calendar connected"
                    : "Connect your Google Calendar to access your schedule"}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#1B4B5A] text-sm flex-shrink-0">
                  {hasFriends ? "✓" : "2"}
                </div>
                <p>
                  {hasFriends
                    ? `You have ${friendCount} ${friendCount === 1 ? "friend" : "friends"} in your circle`
                    : "Add friends to your circle by their email address"}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#1B4B5A] text-sm flex-shrink-0">
                  {hasScheduledMeeting ? "✓" : "3"}
                </div>
                <p>
                  {hasScheduledMeeting
                    ? "You've combined schedules and found the perfect time to meet"
                    : "Find the perfect time to meet by combining your schedules"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </PapyrusCard>
      </div>
    </div>
  );
}
