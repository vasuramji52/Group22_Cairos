import { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  Settings,
  Sun,
} from "lucide-react";
import { Dashboard } from "./dashboard_components/dashboard";
import { FriendsList } from "./dashboard_components/friends-list";
import { ScheduleCombine } from "./dashboard_components/schedule-combine";
import { ProfileSettings } from "./dashboard_components/profile-settings";
import { SundialIcon } from "./dashboard_components/egyptian-decorations";
import { Toaster } from "./ui/sonner";
import './ui/dashboard.css';
import { getFriendsReal } from "./lib/friends.api";

function CardUI()
{
    const navigate = useNavigate();
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
      const userData = localStorage.getItem("user_data");
      if (!userData) {
        // if no user, redirect to login
        navigate("/");
      }
    }, [navigate]);

    async function loadPendingCount() {
      try {
        const data = await getFriendsReal(); // same real API friends loader
        setPendingCount((data?.receivedRequests ?? []).length);
      } catch (err) {
        console.error("Failed to load pending count:", err);
      }
    }

    useEffect(() => {
      loadPendingCount();

      // update every 30s
      const interval = setInterval(loadPendingCount, 30000);
      return () => clearInterval(interval);
    }, []);

    const currentPath = location.pathname;
    
    return (
    <div className="min-h-screen bg-[#1B4B5A] flex">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#1B4B5A] to-[#0F2A34] border-r-2 border-[#D4AF37]/30 flex flex-col z-50">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B4B5A] to-[#0F2A34]">
          <img
            src="/images/hieroglyphics.webp"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none"
          />
        </div>
        
        {/* Sidebar content */}
        <div className="relative z-10 flex flex-col h-full overflow-y-auto">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-[#D4AF37]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center">
              <SundialIcon className="w-6 h-6 text-[#1B4B5A]" />
            </div>
            <div>
              <h2 className="text-[#D4AF37] tracking-wider">CAIROS</h2>
              <p className="text-[#C5A572] text-xs">Find your moment</p>
            </div>
          </div>
        
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/cards/dashboard"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPath === "/cards/dashboard"
                  ? "bg-[#D4AF37] text-[#1B4B5A]"
                  : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            
            <div className="relative">
              <Link
                to="/cards/friends"
                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentPath === "/cards/friends"
                    ? "bg-[#D4AF37] text-[#1B4B5A]"
                    : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Your Circle</span>
              </Link>
              
              {pendingCount > 0 && (
                <span
                  className="absolute top-1/2 -translate-y-1/2 right-4 bg-[#C1440E] text-white 
                             text-xs font-semibold w-5 h-5 flex items-center justify-center
                             rounded-full border border-red-900 shadow"
                >
                  {pendingCount}
                </span>
              )}
            </div>

            <Link
              to="/cards/schedule"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPath === "/cards/schedule"
                  ? "bg-[#D4AF37] text-[#1B4B5A]"
                  : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Find Time</span>
            </Link>
            
            <Link
              to="/cards/settings"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPath === "/cards/settings"
                  ? "bg-[#D4AF37] text-[#1B4B5A]"
                  : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </nav>
            
          {/* Footer - Egyptian motif */}
          <div className="p-6 border-t border-[#D4AF37]/30">
            <div className="flex items-center justify-center gap-2 text-[#D4AF37] opacity-50">
              <Sun className="w-4 h-4" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                ))}
              </div>
              <Sun className="w-4 h-4" />
            </div>
            <p className="text-center text-[#C5A572] mt-2 text-xs">
              Discover the perfect moments to connect
            </p>
          </div>
        </div>
      </aside>
            
      {/* Main Content */}
      <main
        className="flex-1 min-h-screen overflow-y-auto bg-gradient-to-b from-[#1B4B5A] to-[#2C6E7E]"
        style={{ marginLeft: "16rem" }}
      >
        <Routes>
          <Route path="dashboard" element={<Dashboard onNavigate={navigate} />} />
          <Route path="friends" element={<FriendsList onPendingChange={setPendingCount} />} />
          <Route path="schedule" element={<ScheduleCombine />} />
          <Route path="settings" element={<ProfileSettings />} />
          <Route path="*" element={<Dashboard onNavigate={navigate} />} />
        </Routes>
      </main>
            
      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#F5E6D3",
            color: "#1B4B5A",
            border: "2px solid #D4AF37",
          },
        }}
      />
    </div>

  );
}

export default CardUI;
