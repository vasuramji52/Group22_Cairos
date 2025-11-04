import React, { useState } from "react";
import {
  Home,
  Users,
  Calendar,
  Settings,
  Sun,
} from "lucide-react";
import { Dashboard } from "./components/dashboard";
import { FriendsList } from "./components/friends-list";
import { ScheduleCombine } from "./components/schedule-combine";
import { ProfileSettings } from "./components/profile-settings";
import { SundialIcon } from "./components/egyptian-decorations";
import { Toaster } from "./components/ui/sonner";

type View = "dashboard" | "friends" | "schedule" | "settings";

export default function App() {
  const [currentView, setCurrentView] =
    useState<View>("dashboard");

  function handleLogout() {
    // In a real app, this would clear tokens and redirect to login
    setCurrentView("dashboard");
  }

  return (
    <div className="flex min-h-screen bg-[#1B4B5A]">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#1B4B5A] to-[#0F2A34] border-r-2 border-[#D4AF37]/30 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center">
              <SundialIcon className="w-6 h-6 text-[#1B4B5A]" />
            </div>
            <div>
              <h2 className="text-[#D4AF37] tracking-wider">
                CAIROS
              </h2>
              <p className="text-[#C5A572] text-xs">
                Find your moment
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === "dashboard"
                ? "bg-[#D4AF37] text-[#1B4B5A]"
                : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView("friends")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === "friends"
                ? "bg-[#D4AF37] text-[#1B4B5A]"
                : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Your Circle</span>
          </button>

          <button
            onClick={() => setCurrentView("schedule")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === "schedule"
                ? "bg-[#D4AF37] text-[#1B4B5A]"
                : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Find Time</span>
          </button>

          <button
            onClick={() => setCurrentView("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === "settings"
                ? "bg-[#D4AF37] text-[#1B4B5A]"
                : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Footer - Egyptian motif */}
        <div className="p-6 border-t border-[#D4AF37]/30">
          <div className="flex items-center justify-center gap-2 text-[#D4AF37] opacity-50">
            <Sun className="w-4 h-4" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#D4AF37]"
                />
              ))}
            </div>
            <Sun className="w-4 h-4" />
          </div>
          <p className="text-center text-[#C5A572] mt-2 text-xs">
            Like the Nile flows eternal
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === "dashboard" && (
          <Dashboard onNavigate={setCurrentView} />
        )}
        {currentView === "friends" && <FriendsList />}
        {currentView === "schedule" && <ScheduleCombine />}
        {currentView === "settings" && (
          <ProfileSettings onLogout={handleLogout} />
        )}
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