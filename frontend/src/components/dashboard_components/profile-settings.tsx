import { useState } from "react";
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
import { getMe, type User as UserType } from "../lib/mock-api";
//import { toast } from "sonner@2.0.3";

interface ProfileSettingsProps {
  onLogout: () => void;
}

export function ProfileSettings({ onLogout }: ProfileSettingsProps) {
  const [user, setUser] = useState<UserType | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  function doLogout(event: any): void {
      event.preventDefault();
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
                  <p className="text-[#2C6E7E]">
                    {user?.google.connected ? "Connected" : "Not connected"}
                  </p>
                </div>
              </div>
              {user?.google.connected ? (
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  Active
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="border-[#D4AF37] text-[#1B4B5A]"
                >
                  Connect
                </Button>
              )}
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
          <p className="text-[#C5A572]">Version 1.0.0</p>
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
            <AlertDialogCancel className="bg-white border-[#C5A572] text-[#2C6E7E]">
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
    </div>
  );
}
